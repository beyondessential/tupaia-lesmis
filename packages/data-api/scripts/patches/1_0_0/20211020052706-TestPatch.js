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

exports.up = function (db) {
  return db.runSql(`
      CREATE OR REPLACE
      FUNCTION    mv$testPatch()
          RETURNS TEXT
      AS
      $BODY$
      /* ---------------------------------------------------------------------------------------------------------------------------------
      Routine Name: mv$testPatch
      Author:       Rohan Port
      Date:         18/10/2021
      ------------------------------------------------------------------------------------------------------------------------------------
      Revision History    Push Down List
      ------------------------------------------------------------------------------------------------------------------------------------
      Date        | Name          | Description
      ------------+---------------+-------------------------------------------------------------------------------------------------------
                  |               |
      ------------+---------------+-------------------------------------------------------------------------------------------------------
      Description:    Displays the version
      
      Arguments:      IN      None
      Returns:                TEXT    The version 
      
      ************************************************************************************************************************************
      Copyright 2021 Beyond Essential Systems Pty Ltd
      ***********************************************************************************************************************************/
      DECLARE
      
      BEGIN
      
          RETURN 'it works';
      
          EXCEPTION
          WHEN OTHERS
          THEN
              RAISE INFO      'Exception in function mv$help';
              RAISE INFO      'Error %:- %:',     SQLSTATE, SQLERRM;
              RAISE EXCEPTION '%',                SQLSTATE;
      
      END;
      $BODY$
      LANGUAGE    plpgsql
      SECURITY    DEFINER;
  `);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
