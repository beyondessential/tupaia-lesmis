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

const dataElements = [
  'nostu_p1_f',
  'nostu_p1_m',
  'nostu_p2_f',
  'nostu_p2_m',
  'nostu_p3_f',
  'nostu_p3_m',
  'nostu_p4_f',
  'nostu_p4_m',
  'nostu_p5_f',
  'nostu_p5_m',
  'nostu_s1_f',
  'nostu_s1_m',
  'nostu_s2_f',
  'nostu_s2_m',
  'nostu_s3_f',
  'nostu_s3_m',
  'nostu_s4_f',
  'nostu_s4_m',
  'nostu_s5_f',
  'nostu_s5_m',
  'nostu_s6_f',
  'nostu_s6_m',
  'nostu_s7_f',
  'nostu_s7_m',
];

const toIndicator = dataElement => ({
  code: `LESMIS_yearly_${dataElement}`,
  builder: 'analyticArithmetic',
  config: {
    formula: dataElement,
    aggregation: [
      'FINAL_EACH_YEAR',
      {
        type: 'SUM_PER_PERIOD_PER_ORG_UNIT',
        config: { dataSourceEntityType: 'school', aggregationEntityType: 'requested' },
      },
    ],
  },
});

const insertIndicator = async (db, indicator) => {
  await insertObject(db, 'indicator', { ...indicator, id: generateId() });
  await insertObject(db, 'data_source', {
    id: generateId(),
    code: indicator.code,
    type: 'dataElement',
    service_type: 'indicator',
  });
};

const REPORT_CODE = 'LESMIS_student_gender_stacked_gpi';
const REPORT_CONFIG = {
  fetch: {
    aggregations: [
      {
        type: 'MOST_RECENT',
      },
    ],
    dataElements: [
      'LESMIS_yearly_nostu_p1_f',
      'LESMIS_yearly_nostu_p1_m',
      'LESMIS_yearly_nostu_p2_f',
      'LESMIS_yearly_nostu_p2_m',
      'LESMIS_yearly_nostu_p3_f',
      'LESMIS_yearly_nostu_p3_m',
      'LESMIS_yearly_nostu_p4_f',
      'LESMIS_yearly_nostu_p4_m',
      'LESMIS_yearly_nostu_p5_f',
      'LESMIS_yearly_nostu_p5_m',
      'LESMIS_yearly_nostu_s1_f',
      'LESMIS_yearly_nostu_s1_m',
      'LESMIS_yearly_nostu_s2_f',
      'LESMIS_yearly_nostu_s2_m',
      'LESMIS_yearly_nostu_s3_f',
      'LESMIS_yearly_nostu_s3_m',
      'LESMIS_yearly_nostu_s4_f',
      'LESMIS_yearly_nostu_s4_m',
      'LESMIS_yearly_nostu_s5_f',
      'LESMIS_yearly_nostu_s5_m',
      'LESMIS_yearly_nostu_s6_f',
      'LESMIS_yearly_nostu_s6_m',
      'LESMIS_yearly_nostu_s7_f',
      'LESMIS_yearly_nostu_s7_m',
    ],
  },
  transform: [
    {
      '...': '*',
      "'name'":
        "translate($row.dataElement, { LESMIS_yearly_nostu_p1_f: 'Grade 1', LESMIS_yearly_nostu_p1_m: 'Grade 1', LESMIS_yearly_nostu_p2_f: 'Grade 2', LESMIS_yearly_nostu_p2_m: 'Grade 2', LESMIS_yearly_nostu_p3_f: 'Grade 3', LESMIS_yearly_nostu_p3_m: 'Grade 3', LESMIS_yearly_nostu_p4_f: 'Grade 4', LESMIS_yearly_nostu_p4_m: 'Grade 4', LESMIS_yearly_nostu_p5_f: 'Grade 5', LESMIS_yearly_nostu_p5_m: 'Grade 5', LESMIS_yearly_nostu_s1_f: 'Grade 6', LESMIS_yearly_nostu_s1_m: 'Grade 6', LESMIS_yearly_nostu_s2_f: 'Grade 7', LESMIS_yearly_nostu_s2_m: 'Grade 7', LESMIS_yearly_nostu_s3_f: 'Grade 8', LESMIS_yearly_nostu_s3_m: 'Grade 8', LESMIS_yearly_nostu_s4_f: 'Grade 9', LESMIS_yearly_nostu_s4_m: 'Grade 9', LESMIS_yearly_nostu_s5_f: 'Grade 10', LESMIS_yearly_nostu_s5_m: 'Grade 10', LESMIS_yearly_nostu_s6_f: 'Grade 11', LESMIS_yearly_nostu_s6_m: 'Grade 11', LESMIS_yearly_nostu_s7_f: 'Grade 12', LESMIS_yearly_nostu_s7_m: 'Grade 12' })",
      transform: 'select',
    },
    'keyValueByDataElementName',
    {
      '...': 'last',
      name: 'group',
      transform: 'aggregate',
    },
    {
      '...': ['name'],
      "'Male'":
        'sum([$row.LESMIS_yearly_nostu_p1_m, $row.LESMIS_yearly_nostu_p2_m, $row.LESMIS_yearly_nostu_p3_m, $row.LESMIS_yearly_nostu_p4_m, $row.LESMIS_yearly_nostu_p5_m, $row.LESMIS_yearly_nostu_s1_m, $row.LESMIS_yearly_nostu_s2_m, $row.LESMIS_yearly_nostu_s3_m, $row.LESMIS_yearly_nostu_s4_m, $row.LESMIS_yearly_nostu_s5_m, $row.LESMIS_yearly_nostu_s6_m, $row.LESMIS_yearly_nostu_s7_m])',
      "'Female'":
        'sum([$row.LESMIS_yearly_nostu_p1_f, $row.LESMIS_yearly_nostu_p2_f, $row.LESMIS_yearly_nostu_p3_f, $row.LESMIS_yearly_nostu_p4_f, $row.LESMIS_yearly_nostu_p5_f, $row.LESMIS_yearly_nostu_s1_f, $row.LESMIS_yearly_nostu_s2_f, $row.LESMIS_yearly_nostu_s3_f, $row.LESMIS_yearly_nostu_s4_f, $row.LESMIS_yearly_nostu_s5_f, $row.LESMIS_yearly_nostu_s6_f, $row.LESMIS_yearly_nostu_s7_f])',
      transform: 'select',
    },
    {
      '...': '*',
      "'GPI'": '$row.Female/$row.Male',
      transform: 'select',
      "'Male_metadata'": '{ total: $row.Male + $row.Female }',
      "'Female_metadata'": '{ total: $row.Male + $row.Female }',
    },
  ],
};

exports.up = async function (db) {
  await Promise.all(dataElements.map(dataElement => insertIndicator(db, toIndicator(dataElement))));
  await db.runSql(`
    DELETE FROM  report
    WHERE code = '${REPORT_CODE}'
  `);
  await insertObject(db, 'report', {
    id: generateId(),
    code: REPORT_CODE,
    config: REPORT_CONFIG,
    permission_group_id: '5ec481e461f76a077302abf6',
  });
  return null;
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
