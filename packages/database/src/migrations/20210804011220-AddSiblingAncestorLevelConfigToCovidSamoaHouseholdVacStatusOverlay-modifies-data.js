'use strict';

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

const ID = 'WS_COVID_Household_Vaccination_Status';

exports.up = function (db) {
  return db.runSql(`
    UPDATE "mapOverlay"
    SET "measureBuilderConfig" = "measureBuilderConfig" || '{ "siblingAncestorLevel": "sub_district" }'
    WHERE id = '${ID}'
  `);
};

exports.down = function (db) {
  return db.runSql(`
    UPDATE "mapOverlay"
    SET "measureBuilderConfig" = "measureBuilderConfig" - 'siblingAncestorLevel'
    WHERE id = '${ID}'
  `);
};

exports._meta = {
  version: 1,
};
