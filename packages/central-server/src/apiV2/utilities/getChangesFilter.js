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

const basicCTE = `
with 
syncable_meditrak_sync_queue as (
	select * from meditrak_sync_queue
)
`;

const permissionBasedCTE = (allowedCountries, allowedPermissionGroups) => ({
  query: `
with 
allowed_entity as (
	select e.id from entity e 
	where e.country_code in ${SqlQuery.array(allowedCountries)}
), 
allowed_country as (
	select co.id from country co 
	where co.code in ${SqlQuery.array(allowedCountries)}
),
allowed_clinic as (
	select c.id from clinic c 
	join allowed_entity a_e on c.country_id = a_e.id
),
allowed_geographical_area as (
	select ga.id from geographical_area ga 
	join allowed_entity a_e on ga.country_id = a_e.id
),
allowed_permission_group  as (
	select pg.id from permission_group pg  
	where pg."name" in ${SqlQuery.array(allowedPermissionGroups)}
),
allowed_survey as (
	select s.id, s.survey_group_id  from survey s
	join allowed_permission_group apg on s.permission_group_id = apg.id
),
allowed_survey_group as (
	select sg.id from survey_group sg 
	join allowed_survey a_s on a_s.survey_group_id = sg.id
),
allowed_survey_screen as (
	select ss.id from survey_screen ss 
	join allowed_survey a_s on ss.survey_id = a_s.id
),
allowed_survey_screen_component as (
	select ssc.id, ssc.question_id from survey_screen_component ssc 
	join allowed_survey_screen ass on ssc.screen_id = ass.id
),
allowed_question as (
	select q.id, q.option_set_id from question q  
	join allowed_survey_screen_component assc on assc.question_id = q.id
),
allowed_option_set as (
	select os.id from option_set os   
	join allowed_question aq on aq.option_set_id = os.id
),
allowed_option as (
	select o.id from "option" o    
	join allowed_option_set aos on o.option_set_id = aos.id
),allowed_meditrak_sync_queue as (
  select msq.* from meditrak_sync_queue msq 
  join (
  (select id from allowed_entity)
  union 
  (select id from allowed_clinic)
  union 
  (select id from allowed_country)
  union 
  (select id from allowed_geographical_area)
  union 
  (select id from allowed_permission_group)
  union 
  (select id from allowed_survey)
  union 
  (select id from allowed_survey_group)
  union 
  (select id from allowed_survey_screen)
  union 
  (select id from allowed_survey_screen_component)
  union 
  (select id from allowed_question)
  union 
  (select id from allowed_option_set)
  union 
  (select id from allowed_option)
  ) id_with_permission on msq.record_id = id_with_permission.id
),syncable_meditrak_sync_queue as (
  select * from allowed_meditrak_sync_queue
  union 
  (select * from meditrak_sync_queue msq where "type" = 'delete')
)
`,
  params: [...allowedCountries, ...allowedCountries, ...allowedPermissionGroups],
});

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
  SELECT ${select} FROM syncable_meditrak_sync_queue
`;

const getBaseWhere = since => {
  // Based on the 'since' query parameter, work out what the highest possible record id is that
  // the client could have already synchronised, and ignore any 'delete' type sync actions for
  // records with higher ids: if the client doesn't know about them there is no point in telling
  // them to delete them
  const highestPossibleSyncedId = getHighestPossibleIdForGivenTime(since);

  const baseQuery = `
    WHERE
    change_time > ?
    and (type = ? or record_id <= ?)
  `;
  const params = [since, 'update', highestPossibleSyncedId];

  return { query: baseQuery, params };
};

const extractSinceValue = req => {
  const { since = 0 } = req.query;
  if (isNaN(since)) {
    throw new ValidationError("The 'since' parameter must be a number.");
  }

  return parseFloat(since);
};

const extractPermissionsBasedFilterProps = req => {
  const { countriesInDatabase, permissionGroupsInDatabase } = req.query;

  if (!countriesInDatabase) {
    return null;
  }

  if (!permissionGroupsInDatabase) {
    return null;
  }

  return {
    countriesInDatabase: countriesInDatabase.split(','),
    permissionGroupsInDatabase: permissionGroupsInDatabase.split(','),
  };
};

export const getChangesFilter = async (req, { select, sort, limit, offset }) => {
  const since = extractSinceValue(req);
  const permissionBasedFilterProps = extractPermissionsBasedFilterProps(req);

  let { query, params } = getBaseWhere(since);
  const recordTypeFilter = await getRecordTypeFilter(req);

  if (recordTypeFilter) {
    const { comparator, comparisonValue } = recordTypeFilter;
    query = query.concat(`
      AND record_type ${comparator} ${SqlQuery.array(comparisonValue)}
    `);
    params.push(...comparisonValue);
  }

  if (permissionBasedFilterProps) {
    const { countriesInDatabase, permissionGroupsInDatabase } = permissionBasedFilterProps;
    const { query: cteQuery, params: cteParams } = permissionBasedCTE(
      countriesInDatabase,
      permissionGroupsInDatabase,
    );
    query = cteQuery.concat(getSelectFromClause(select)).concat(query);
    params = cteParams.concat(params);
  } else {
    query = basicCTE.concat(getSelectFromClause(select)).concat(query);
  }

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
