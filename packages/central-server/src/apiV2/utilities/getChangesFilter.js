/**
 * Tupaia MediTrak
 * Copyright (c) 2019 Beyond Essential Systems Pty Ltd
 */

import { get } from 'lodash';
import semverCompare from 'semver-compare';

import { getHighestPossibleIdForGivenTime, SqlQuery } from '@tupaia/database';
import { ValidationError } from '@tupaia/utils';
import { fetchRequestingMeditrakDevice } from './fetchRequestingMeditrakDevice';

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

const getBaseWhere = (since, permissionsBasedFilter) => {
  // Based on the 'since' query parameter, work out what the highest possible record id is that
  // the client could have already synchronised, and ignore any 'delete' type sync actions for
  // records with higher ids: if the client doesn't know about them there is no point in telling
  // them to delete them
  const highestPossibleSyncedId = getHighestPossibleIdForGivenTime(since);

  let query = `
    WHERE
    change_time > ?
  `;
  const params = [since];

  if (permissionsBasedFilter) {
    const { allowedCountries, allowedCountyIds, allowedPermissionGroups } = permissionsBasedFilter;
    const typesWithoutPermissions = ['country', 'permission_group'];
    const permissionsByType = {
      entity: { country: { value: allowedCountries, operator: 'IN', formatter: SqlQuery.array } },
      clinic: { country: { value: allowedCountries, operator: 'IN', formatter: SqlQuery.array } },
      geographical_area: {
        country: { value: allowedCountries, operator: 'IN', formatter: SqlQuery.array },
      },
      survey: {
        permission: { value: allowedPermissionGroups, operator: 'IN', formatter: SqlQuery.array },
        countries: { value: allowedCountyIds, operator: '&&', formatter: SqlQuery.inlineArray },
      },
      survey_group: {
        permission: { value: allowedPermissionGroups, operator: 'IN', formatter: SqlQuery.array },
        countries: { value: allowedCountyIds, operator: '&&', formatter: SqlQuery.inlineArray },
      },
      survey_screen: {
        permission: { value: allowedPermissionGroups, operator: 'IN', formatter: SqlQuery.array },
        countries: { value: allowedCountyIds, operator: '&&', formatter: SqlQuery.inlineArray },
      },
      survey_screen_component: {
        permission: { value: allowedPermissionGroups, operator: 'IN', formatter: SqlQuery.array },
        countries: { value: allowedCountyIds, operator: '&&', formatter: SqlQuery.inlineArray },
      },
      question: {
        permission: { value: allowedPermissionGroups, operator: 'IN', formatter: SqlQuery.array },
        countries: { value: allowedCountyIds, operator: '&&', formatter: SqlQuery.inlineArray },
      },
      option_set: {
        permission: { value: allowedPermissionGroups, operator: 'IN', formatter: SqlQuery.array },
        countries: { value: allowedCountyIds, operator: '&&', formatter: SqlQuery.inlineArray },
      },
      option: {
        permission: { value: allowedPermissionGroups, operator: 'IN', formatter: SqlQuery.array },
        countries: { value: allowedCountyIds, operator: '&&', formatter: SqlQuery.inlineArray },
      },
    };

    const permissionLessClause = `and (
      ("type" = ? and record_type IN ${SqlQuery.array(typesWithoutPermissions)})`;
    query = query.concat(permissionLessClause);
    params.push('update', ...typesWithoutPermissions);

    const permissionClauses = Object.entries(permissionsByType).map(
      ([field, permissionRules]) =>
        `(${Object.entries(permissionRules)
          .map(([permissionType, { value, formatter, operator }]) => {
            const clause = `${field}_${permissionType} ${operator} ${formatter(value)}`;
            params.push(...value);
            return clause;
          })
          .join(' and ')})`,
    );

    permissionClauses.forEach(clause => {
      query = query.concat(`
        OR ${clause}
      `);
    });
  } else {
    query.concat(`
    and "type" = ?
    `);
    params.push('update');
  }

  query = query.concat(`
    or ("type" = ? and record_id <= ?))
  `);
  params.push('delete', highestPossibleSyncedId);

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
  const { countriesInDatabase, permissionGroupsInDatabase } = req.query;

  if (!countriesInDatabase) {
    return null;
  }

  if (!permissionGroupsInDatabase) {
    return null;
  }

  const allowedCountries = countriesInDatabase.split(',');
  const allowedCountyIds = (await req.models.country.find({ code: allowedCountries })).map(
    country => country.id,
  );
  const allowedPermissionGroups = permissionGroupsInDatabase.split(',');

  return {
    allowedCountries,
    allowedCountyIds,
    allowedPermissionGroups,
  };
};

export const getChangesFilter = async (req, { select, sort, limit, offset }) => {
  const since = extractSinceValue(req);
  const permissionBasedFilter = await extractPermissionsBasedFilter(req);

  // eslint-disable-next-line prefer-const
  let { query, params } = getBaseWhere(since, permissionBasedFilter);
  const recordTypeFilter = await getRecordTypeFilter(req);

  if (recordTypeFilter) {
    const { comparator, comparisonValue } = recordTypeFilter;
    query = query.concat(`
      AND record_type ${comparator} ${SqlQuery.array(comparisonValue)}
    `);
    params.push(...comparisonValue);
  }

  query = getSelectFromClause(select).concat(query);

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

  return new SqlQuery(query, params);
};
