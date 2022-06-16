/**
 * Tupaia MediTrak
 * Copyright (c) 2019 Beyond Essential Systems Pty Ltd
 */

import { get } from 'lodash';
import semverCompare from 'semver-compare';

import { getHighestPossibleIdForGivenTime, SqlQuery, QUERY_CONJUNCTIONS } from '@tupaia/database';
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

const getBaseFilter = (since, countriesInDatabase) => {
  // Based on the 'since' query parameter, work out what the highest possible record id is that
  // the client could have already synchronised, and ignore any 'delete' type sync actions for
  // records with higher ids: if the client doesn't know about them there is no point in telling
  // them to delete them
  const highestPossibleSyncedId = getHighestPossibleIdForGivenTime(since);

  let baseQuery = `
    change_time > ?
    and (meditrak_sync_queue.type = ? or record_id <= ?)
  `;
  const params = [since, 'update', highestPossibleSyncedId];
  if (countriesInDatabase) {
    baseQuery = baseQuery.concat(`
      and (entity.country_code IN ${SqlQuery.array(countriesInDatabase)} or record_type != ?)
    `);
    params.push(...countriesInDatabase, 'entity');
  }
  return { query: baseQuery, params };
};

const extractSinceValue = req => {
  const { since = 0 } = req.query;
  if (isNaN(since)) {
    throw new ValidationError("The 'since' parameter must be a number.");
  }

  return parseFloat(since);
};

const extractCountriesInDatabaseValue = req => {
  const { countriesInDatabase } = req.query;

  return countriesInDatabase ? countriesInDatabase.split(',') : countriesInDatabase;
};

export const getChangesFilter = async req => {
  const since = extractSinceValue(req);
  const countriesInDatabase = extractCountriesInDatabaseValue(req);
  let { query, params } = getBaseFilter(since, countriesInDatabase);
  const recordTypeFilter = await getRecordTypeFilter(req);

  if (recordTypeFilter) {
    const { comparator, comparisonValue } = recordTypeFilter;
    query = query.concat(`
      and record_type ${comparator} ${SqlQuery.array(comparisonValue)}
    `);
    params.push(...comparisonValue);
  }

  return {
    [QUERY_CONJUNCTIONS.RAW]: {
      sql: query,
      parameters: params,
    },
  };
};
