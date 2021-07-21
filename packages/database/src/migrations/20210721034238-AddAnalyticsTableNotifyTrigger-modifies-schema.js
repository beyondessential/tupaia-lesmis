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
  CREATE OR REPLACE FUNCTION public.analytics_notification()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $function$
      DECLARE
      new_json_record JSONB;
      old_json_record JSONB;
      change_type TEXT;
      BEGIN
  
      -- if nothing has changed, no need to trigger a notification
      IF TG_OP = 'UPDATE' AND OLD = NEW THEN
        RETURN NULL;
      END IF;
  
      -- set the change_type from the less readable TG_OP
      IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        change_type := 'update';
      ELSE
        change_type := 'delete';
      END IF;
  
      -- set up the old and new records
      IF TG_OP <> 'INSERT' THEN
        old_json_record := to_jsonb(OLD);
      END IF;
      IF TG_OP <> 'DELETE' THEN
        new_json_record := to_jsonb(NEW);
      END IF;
  
      -- publish change notification
      PERFORM pg_notify(
        'change',
        json_build_object(
          'record_type',
          TG_TABLE_NAME,
          'type',
          change_type,
          'old_record',
          old_json_record,
          'new_record',
          new_json_record
        )::text
      );
  
      -- return the appropriate record to allow the trigger to pass
      IF change_type = 'update' THEN
        RETURN NEW;
      ELSE
        RETURN OLD;
      END IF;
  
      END;
      $function$
  ;

  create trigger analytics_trigger after
  insert
      or
  delete
      or
  update
      on
      public.analytics for each row execute procedure analytics_notification();
  `);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  version: 1,
};
