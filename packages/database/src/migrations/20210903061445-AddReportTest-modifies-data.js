'use strict';

import { insertObject, generateId, nameToId, deleteObject } from '../utilities';

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

const PERMISSION_GROUP_NAME = 'PacMOSSI';

const dataElementsToNames = {
  PMOS_An_Farauti: 'An. farauti',
  PMOS_An_Koliensis: 'An. koliensis',
  PMOS_An_Punctulatus: 'An. punctulatus',
  PMOS_Ae_Aegypti: 'Ae. aegypti',
  PMOS_Ae_Albopictus: 'Ae. albopictus',
  PMOS_Ae_Cooki: 'Ae. cooki',
  PMOS_Ae_Hensilli: 'Ae. hensilli',
  PMOS_Ae_Marshallensis: 'Ae. marshallensis',
  PMOS_Ae_Polynesiensis: 'Ae. polynesiensis',
  PMOS_Ae_Rotumae: 'Ae. rotumae',
  PMOS_Ae_Scutellaris: 'Ae. scutellaris',
  PMOS_Ae_Vigilax: 'Ae. vigilax',
  PMOS_Cx_Annulirostris: 'Cx. annulirostris',
  PMOS_Cx_Quinquefasciatus: 'Cx. quinquefasciatus',
  PMOS_Cx_Sitiens: 'Cx. sitiens',
  PMOS_Mn_Uniformis: 'Mn. uniformis',
};

exports.up = async function (db) {
  const permissionId = await nameToId(db, 'permission_group', PERMISSION_GROUP_NAME);
  await insertObject(db, 'report', {
    id: generateId(),
    code: 'PacMOSS_Distribution_Of_Anopheles_Farauti_Test',
    config: {
      fetch: {
        dataElements: [
          'PMOS_An_Farauti',
          'PMOS_An_Koliensis',
          'PMOS_An_Punctulatus',
          'PMOS_Ae_Aegypti',
          'PMOS_Ae_Albopictus',
          'PMOS_Ae_Cooki',
          'PMOS_Ae_Hensilli',
          'PMOS_Ae_Marshallensis',
          'PMOS_Ae_Polynesiensis',
          'PMOS_Ae_Rotumae',
          'PMOS_Ae_Scutellaris',
          'PMOS_Ae_Vigilax',
          'PMOS_Cx_Annulirostris',
          'PMOS_Cx_Quinquefasciatus',
          'PMOS_Cx_Sitiens',
          'PMOS_Mn_Uniformis',
        ],
        aggregations: [
          {
            type: 'SUM_PER_ORG_GROUP',
            config: { dataSourceEntityType: 'field_station', aggregationEntityType: 'district' },
          },
        ],
      },
      transform: [
        {
          transform: 'select',
          "'species'": `translate($row.dataElement, ${JSON.stringify(dataElementsToNames)})`,
          "'organisationUnitCode'": '$row.organisationUnit',
          "'denominator'":
            'sum($where(f($otherRow) = equalText($otherRow.organisationUnit,$row.organisationUnit)).value)',
          "'numerator'": '$row.value',
        },
        { transform: 'filter', where: '$row.denominator > 0' }, // array.filter(a=>a.denominator > 0)
        {
          transform: 'select',
          '$row.species': 'formatAsFractionAndPercentage($row.numerator, $row.denominator)',
          '...': ['organisationUnitCode'],
        },
      ],
    },
    permission_group_id: permissionId,
  });
};

exports.down = async function (db) {
  await deleteObject(db, 'report', { code: 'PacMOSS_Distribution_Of_Anopheles_Farauti_Test' });
};

exports._meta = {
  version: 1,
};
