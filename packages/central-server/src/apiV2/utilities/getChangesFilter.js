/**
 * Tupaia MediTrak
 * Copyright (c) 2019 Beyond Essential Systems Pty Ltd
 */

import { get } from 'lodash';
import semverCompare from 'semver-compare';

import { getHighestPossibleIdForGivenTime, SqlQuery } from '@tupaia/database';
import { ValidationError } from '@tupaia/utils';
import { fetchRequestingMeditrakDevice } from './fetchRequestingMeditrakDevice';
import {
  PERMISSIONS_BASED_SYNC_MIN_APP_VERSION,
  supportsPermissionsBasedSync,
} from './supportsPermissionsBasedSync';

const isAppVersionGreaterThanMin = (version, minVersion) => semverCompare(version, minVersion) >= 0;

const getSupportedTypes = async (models, appVersion) => {
  const minAppVersionByType = models.getMinAppVersionByType();
  return Object.keys(minAppVersionByType).filter(type =>
    isAppVersionGreaterThanMin(appVersion, minAppVersionByType[type]),
  );
};

const getRecordTypeFilter = async req => {
  const { models } = req;
  const { appVersion, recordTypes = null } = req.query;

  if (recordTypes) {
    return { comparator: 'IN', comparisonValue: recordTypes.split(',') };
  }
  if (appVersion) {
    return { comparator: 'IN', comparisonValue: await getSupportedTypes(models, appVersion) };
  }

  const meditrakDevice = await fetchRequestingMeditrakDevice(req);
  const unsupportedTypes = get(meditrakDevice, 'config.unsupportedTypes', []);
  if (unsupportedTypes.length > 0) {
    return { comparator: 'NOT IN', comparisonValue: unsupportedTypes };
  }

  return null;
};

const getSelectFromClause = select => `
  SELECT ${select} FROM permissions_based_meditrak_sync_queue
`;

const getBaseWhere = async (req, since, permissionsBasedFilter) => {
  // Based on the 'since' query parameter, work out what the highest possible record id is that
  // the client could have already synchronised, and ignore any 'delete' type sync actions for
  // records with higher ids: if the client doesn't know about them there is no point in telling
  // them to delete them
  const highestPossibleSyncedId = getHighestPossibleIdForGivenTime(since);

  let query = `
    change_time > ?
    AND (
  `;
  const params = [since];

  if (permissionsBasedFilter) {
    const { allowedCountries, allowedCountryIds, allowedPermissionGroups } = permissionsBasedFilter;
    const typesWithoutPermissions = ['country', 'permission_group']; // Sync all countries and permission groups (needed for requesting access)
    const permissionsClauses = [
      {
        query: `"type" = ? AND record_type IN ${SqlQuery.array(typesWithoutPermissions)}`,
        params: ['update', ...typesWithoutPermissions],
      },
      {
        query: `entity_type = ?`, // Sync all country entities (needed for requesting access to countries)
        params: ['country'],
      },
      {
        query: `entity_country IN ${SqlQuery.array(allowedCountries)}`,
        params: [...allowedCountries],
      },
      {
        query: `clinic_country IN ${SqlQuery.array(allowedCountries)}`,
        params: [...allowedCountries],
      },
      {
        query: `geographical_area_country IN ${SqlQuery.array(allowedCountries)}`,
        params: [...allowedCountries],
      },
      {
        query: `survey_permissions && ${SqlQuery.inlineArray(
          allowedPermissionGroups,
        )} AND survey_countries && ${SqlQuery.inlineArray(allowedCountryIds)}`,
        params: [...allowedPermissionGroups, ...allowedCountryIds],
      },
      {
        query: `survey_group_permissions && ${SqlQuery.inlineArray(
          allowedPermissionGroups,
        )} AND survey_group_countries && ${SqlQuery.inlineArray(allowedCountryIds)}`,
        params: [...allowedPermissionGroups, ...allowedCountryIds],
      },
      {
        query: `survey_screen_permissions && ${SqlQuery.inlineArray(
          allowedPermissionGroups,
        )} AND survey_screen_countries && ${SqlQuery.inlineArray(allowedCountryIds)}`,
        params: [...allowedPermissionGroups, ...allowedCountryIds],
      },
      {
        query: `survey_screen_component_permissions && ${SqlQuery.inlineArray(
          allowedPermissionGroups,
        )} AND survey_screen_component_countries && ${SqlQuery.inlineArray(allowedCountryIds)}`,
        params: [...allowedPermissionGroups, ...allowedCountryIds],
      },
      {
        query: `question_permissions && ${SqlQuery.inlineArray(
          allowedPermissionGroups,
        )} AND question_countries && ${SqlQuery.inlineArray(allowedCountryIds)}`,
        params: [...allowedPermissionGroups, ...allowedCountryIds],
      },
      {
        query: `option_set_permissions && ${SqlQuery.inlineArray(
          allowedPermissionGroups,
        )} AND option_set_countries && ${SqlQuery.inlineArray(allowedCountryIds)}`,
        params: [...allowedPermissionGroups, ...allowedCountryIds],
      },
      {
        query: `option_permissions && ${SqlQuery.inlineArray(
          allowedPermissionGroups,
        )} AND option_countries && ${SqlQuery.inlineArray(allowedCountryIds)}`,
        params: [...allowedPermissionGroups, ...allowedCountryIds],
      },
    ];

    permissionsClauses.forEach(({ query: permClauseQuery, params: permClauseParams }, index) => {
      query = query.concat(`
          ${index !== 0 ? 'OR ' : ''}(${permClauseQuery})
        `);
      params.push(...permClauseParams);
    });
  } else {
    // If not permissions based filter just sync all updates
    query = query.concat(`
    "type" = ?
    `);
    params.push('update');
  }

  // Only sync deletes that have occurred prior to the latest possibly synced record
  query = query.concat(`
    OR ("type" = ? AND record_id <= ?))
  `);
  params.push('delete', highestPossibleSyncedId);

  const recordTypeFilter = await getRecordTypeFilter(req);

  if (recordTypeFilter) {
    const { comparator, comparisonValue } = recordTypeFilter;
    query = query.concat(`
      AND record_type ${comparator} ${SqlQuery.array(comparisonValue)}
    `);
    params.push(...comparisonValue);
  }

  return { query, params };
};

const extractSinceValue = req => {
  const { since = 0 } = req.query;
  if (isNaN(since)) {
    throw new ValidationError("The 'since' parameter must be a number.");
  }

  return parseFloat(since);
};

const extractPermissionsBasedFilter = async req => {
  const { accessPolicy } = req;
  const {
    appVersion,
    countriesSynced: countriesSyncedString,
    permissionGroupsSynced: permissionGroupsSyncedString,
  } = req.query;

  if (!supportsPermissionsBasedSync(appVersion)) {
    throw new Error(
      `Permissions based sync is not supported for appVersion: ${appVersion}, must be ${PERMISSIONS_BASED_SYNC_MIN_APP_VERSION} or higher`,
    );
  }

  const usersCountries = accessPolicy.getEntitiesAllowed();
  const usersPermissionGroups = accessPolicy.getPermissionGroups();

  // First time sync, just return new countries and permission groups
  if (!countriesSyncedString || !permissionGroupsSyncedString) {
    const userCountryIds = (await req.models.country.find({ code: usersCountries })).map(
      country => country.id,
    );
    return {
      unsynced: {
        allowedCountries: usersCountries,
        allowedCountryIds: userCountryIds,
        allowedPermissionGroups: usersPermissionGroups,
      },
    };
  }

  const syncedCountries = countriesSyncedString.split(',');
  const syncedPermissionGroups = permissionGroupsSyncedString.split(',');
  const syncedCountryIds = (await req.models.country.find({ code: syncedCountries })).map(
    country => country.id,
  );

  const unsyncedCountries = usersCountries.filter(country => !syncedCountries.includes(country));
  const unsyncedPermissionGroups = usersPermissionGroups.filter(
    permissionGroup => !syncedPermissionGroups.includes(permissionGroup),
  );

  if (unsyncedCountries.length === 0 && unsyncedPermissionGroups.length === 0) {
    // No new countries or permissionGroups, just return synced
    return {
      synced: {
        allowedCountries: syncedCountries,
        allowedCountryIds: syncedCountryIds,
        allowedPermissionGroups: syncedPermissionGroups,
      },
    };
  }

  const unsyncedCountryIds = (await req.models.country.find({ code: unsyncedCountries })).map(
    country => country.id,
  );

  return {
    unsynced: {
      allowedCountries: unsyncedCountries,
      allowedCountryIds: unsyncedCountryIds,
      allowedPermissionGroups: unsyncedPermissionGroups,
    },
    synced: {
      allowedCountries: syncedCountries,
      allowedCountryIds: syncedCountryIds,
      allowedPermissionGroups: syncedPermissionGroups,
    },
  };
};

export const getChangesFilter = async (req, { select, sort, limit, offset }) => {
  const since = extractSinceValue(req);

  let query = '';
  const params = [];
  query = query.concat(getSelectFromClause(select));
  const { query: whereQuery, params: whereParams } = await getBaseWhere(req, since);
  query = query.concat(`WHERE
  ${whereQuery}`);
  params.push(...whereParams);

  if (sort) {
    query = query.concat(`
    ORDER BY ${sort}
    `);
  }

  if (limit !== undefined) {
    query = query.concat(`
    LIMIT ?
    `);
    params.push(limit);
  }

  if (offset !== undefined) {
    query = query.concat(`
    OFFSET ?
    `);
    params.push(offset);
  }

  return { query: new SqlQuery(query, params) };
};

export const getPermissionsBasedChangesFilter = async (req, { select, sort, limit, offset }) => {
  const since = extractSinceValue(req);
  const permissionBasedFilter = await extractPermissionsBasedFilter(req);

  let query = '';
  const params = [];
  const { unsynced, synced } = permissionBasedFilter;
  if (unsynced) {
    query = query.concat(getSelectFromClause(select));
    query = query.concat(`WHERE (
    `);
    const { query: whereQuery, params: whereParams } = await getBaseWhere(req, 0, unsynced);
    query = query.concat(whereQuery);
    params.push(...whereParams);
  }

  if (unsynced && synced) {
    query = query.concat(`
      ) OR (
      `);
  }

  if (synced) {
    if (!unsynced) {
      query = query.concat(getSelectFromClause(select));
      query = query.concat(`WHERE (
        `);
    }
    const { query: whereQuery, params: whereParams } = await getBaseWhere(req, since, synced);
    query = query.concat(whereQuery);
    params.push(...whereParams);
  }

  query = query.concat(`)
  `);

  if (sort) {
    query = query.concat(`
    ORDER BY ${sort}
    `);
  }

  if (limit !== undefined) {
    query = query.concat(`
    LIMIT ?
    `);
    params.push(limit);
  }

  if (offset !== undefined) {
    query = query.concat(`
    OFFSET ?
    `);
    params.push(offset);
  }

  const countriesInSync = [
    ...(unsynced?.allowedCountries || []),
    ...(synced?.allowedCountries || []),
  ];
  const permissionGroupsInSync = [
    ...(unsynced?.allowedPermissionGroups || []),
    ...(synced?.allowedPermissionGroups || []),
  ];

  return {
    query: new SqlQuery(query, params),
    countries: countriesInSync,
    permissionGroups: permissionGroupsInSync,
  };
};
