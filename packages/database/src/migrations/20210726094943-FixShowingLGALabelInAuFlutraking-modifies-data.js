'use strict';

import { codeToId, insertObject, generateId, deleteObject } from '../utilities';

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

const districts = [
  'AU_Queensland',
  'AU_Victoria',
  'AU_South Australia',
  'AU_Western Australia',
  'AU_Tasmania',
  'AU_Northern Territory',
  'AU_New South Wales',
  'AU_Australian Capital Territory',
];

exports.up = async function (db) {
  return Promise.all(
    districts.map(async districtCode => {
      const districtId = await codeToId(db, 'entity', districtCode);
      const newSubDistrictId = generateId();

      await insertObject(db, 'entity', {
        id: newSubDistrictId,
        code: `${districtCode}_Postcodes`,
        parent_id: districtId,
        name: `${districtCode.substr(3)} Postcodes`,
        type: 'sub_district',
        country_code: 'AU',
      });

      await db.runSql(`
        UPDATE entity
        SET parent_id = '${newSubDistrictId}'
        WHERE "type" = 'postcode' and parent_id = '${districtId}';
      `);
    }),
  );
};

exports.down = async function (db) {
  return Promise.all(
    districts.map(async districtCode => {
      const districtId = await codeToId(db, 'entity', districtCode);
      const newSubDistrictCode = `${districtCode}_Postcodes`;
      const newSubDistrictId = await codeToId(db, 'entity', newSubDistrictCode);

      await db.runSql(`
      UPDATE entity
      SET parent_id = '${districtId}'
      WHERE "type" = 'postcode' and parent_id = '${newSubDistrictId}';
    `);

      await deleteObject(db, 'entity', { code: newSubDistrictCode });
    }),
  );
};

exports._meta = {
  version: 1,
};
