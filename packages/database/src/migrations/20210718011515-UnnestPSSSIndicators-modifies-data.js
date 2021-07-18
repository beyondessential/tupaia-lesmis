'use strict';

import { arrayToDbString, generateId, insertObject } from '../utilities';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

const SYNDROMES = ['AFR', 'PF', 'DLI', 'DIA', 'ILI'];

const getIndicatorPrefix = indicator => {
  let matchingSyndrome = '';
  SYNDROMES.forEach(syndrome => {
    const matchingIndex = indicator.indexOf(syndrome);
    if (matchingIndex > -1) {
      matchingSyndrome = syndrome;
    }
  });

  return indicator.slice(0, indicator.indexOf(matchingSyndrome) + matchingSyndrome.length);
};

const camelToUpperSnakeCase = str =>
  `${str[0].toUpperCase()}${str
    .slice(1)
    .replace(/[A-Z1-9]/g, letter => `_${letter.toUpperCase()}`)}`;

const unnestedParameterCode = (indicator, parameter) => {
  switch (parameter) {
    case 'siteWeeklyResponsesCount':
    case 'siteDailyResponsesCount':
      return `SUM_${camelToUpperSnakeCase(parameter)}`;
    case 'siteAveragePrevWeek':
      if (indicator.indexOf('AFR') > -1) {
        return `${getIndicatorPrefix(indicator)}_${camelToUpperSnakeCase('siteAverage1WeekAgo')}`;
      }
      return undefined;
    default:
      return `${getIndicatorPrefix(indicator)}_${camelToUpperSnakeCase(parameter)}`;
  }
};

const updateCodes = (indicator, formula) => {
  return formula
    .replace(/siteAveragePrevWeek/g, unnestedParameterCode(indicator, 'siteAverage1WeekAgo'))
    .replace(/siteAverage2WeeksAgo/g, unnestedParameterCode(indicator, 'siteAverage2WeeksAgo'))
    .replace(
      /siteDailyResponsesCount/g,
      unnestedParameterCode(indicator, 'siteDailyResponsesCount'),
    )
    .replace(/sumSiteWeeklyCases/g, unnestedParameterCode(indicator, 'sumSiteWeeklyCases'))
    .replace(/siteAverage3WeeksAgo/g, unnestedParameterCode(indicator, 'siteAverage3WeeksAgo'))
    .replace(/siteAverage1WeekAgo/g, unnestedParameterCode(indicator, 'siteAverage1WeekAgo'))
    .replace(
      /siteWeeklyResponsesCount/g,
      unnestedParameterCode(indicator, 'siteWeeklyResponsesCount'),
    )
    .replace(/sumSiteDailyCases/g, unnestedParameterCode(indicator, 'sumSiteDailyCases'));
};

const updateDefaultValues = (indicator, defaultValues) => {
  if (!defaultValues) {
    return undefined;
  }

  return Object.entries(defaultValues).reduce(
    (object, [key, value]) => ({ ...object, [`${updateCodes(indicator, key)}`]: value }),
    {},
  );
};

const getPSSSParameters = async db => {
  return (
    await db.runSql(`
  select indicator_code, formula, default_values, params->>'code' as parameter_code, params->'config' as config, params->>'builder' as builder
  from
    (select code as indicator_code, config->>'formula' as formula, config->'defaultValues' as default_values, jsonb_array_elements(config->'parameters') as params from "indicator" i
    where config->>'parameters' is not null and code like '%PSSS%') as parameters`)
  ).rows;
};

const updateParameterIndicator = async (db, { code, formula, aggregation, defaultValues }) => {
  await db.runSql(`
      UPDATE indicator
      SET config = jsonb_set(config, '{formula}', '"${formula}"')
      WHERE code = '${code}';
  `);

  await db.runSql(`
      UPDATE indicator
      SET config = jsonb_set(config, '{aggregation}', '"${aggregation}"')
      WHERE code = '${code}';
  `);

  await db.runSql(`
      UPDATE indicator
      SET config = config - 'parameters'
      WHERE code = '${code}';
  `);

  if (defaultValues) {
    await db.runSql(`
      UPDATE indicator
      SET config = jsonb_set(config, '{defaultValues}', '${JSON.stringify(defaultValues)}')
      WHERE code = '${code}';
  `);
  }
};

const insertIndicator = async (db, indicator) => {
  await insertObject(db, 'indicator', { ...indicator, id: generateId() });
  await insertObject(db, 'data_source', {
    id: generateId(),
    code: indicator.code,
    type: 'dataElement',
    service_type: 'indicator',
  });
};

exports.up = async function (db) {
  const parameters = await getPSSSParameters(db);
  const nestedIndicators = parameters.map(
    ({ indicator_code, parameter_code, builder, config }) => ({
      code: unnestedParameterCode(indicator_code, parameter_code),
      builder,
      config,
    }),
  );

  await Promise.all(
    nestedIndicators.map(nestedIndicator => {
      if (nestedIndicator.code) return insertIndicator(db, nestedIndicator);
      return undefined;
    }),
  );

  const updatedIndicators = parameters.map(({ indicator_code, formula, default_values }) => ({
    code: indicator_code,
    formula: updateCodes(indicator_code, formula),
    aggregation: 'FINAL_EACH_WEEK',
    defaultValues: updateDefaultValues(indicator_code, default_values),
  }));

  await Promise.all(
    updatedIndicators.map(updatedIndicator => updateParameterIndicator(db, updatedIndicator)),
  );

  return null;
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
