/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import knex from 'knex';

import { DatabaseModel } from '../DatabaseModel';
import { DatabaseType } from '../DatabaseType';
import { TYPES } from '../types';

export class ExternalDatabaseConnectionType extends DatabaseType {
  static databaseType = TYPES.EXTERNAL_DATABASE_CONNECTION;

  async executeSql(sql, parameters) {
    const connection = this.model.acquireConnection(this);
    const result = await connection.raw(sql, parameters);
    return result.rows;
  }

  async testConnection() {
    const [{ is_connected: isConnected }] = await this.executeSql('select TRUE as is_connected');
    return isConnected;
  }
}

export class ExternalDatabaseConnectionModel extends DatabaseModel {
  // Map of active external connections that have been established
  // Using singleton pattern to avoid individual instances overwhelming the external
  // databases with requests
  activeConnections = {};

  get DatabaseTypeClass() {
    return ExternalDatabaseConnectionType;
  }

  async update(whereCondition, fieldsToUpdate) {
    // Clear connections before updating the records
    const connectionsToUpdate = await this.find(whereCondition);
    await Promise.all(connectionsToUpdate.map(connection => this.closeConnection(connection)));

    await super.update(whereCondition, fieldsToUpdate);
  }

  async delete(whereConditions) {
    // Clear connections before deleting the records
    const connectionsToDelete = await this.find(whereConditions);
    await Promise.all(connectionsToDelete.map(connection => this.closeConnection(connection)));

    await super.delete(whereConditions);
  }

  acquireConnection(externalDatabaseConnectionType) {
    const {
      id: connectionId,
      host,
      port,
      database_name: database,
      username: user,
      password_base_64: passwordBase64,
    } = externalDatabaseConnectionType;
    const establishedConnection = this.activeConnections[connectionId];
    if (establishedConnection) {
      return establishedConnection;
    }

    const connection = knex({
      client: 'pg',
      connection: {
        host,
        port: parseInt(port),
        database,
        user,
        password: Buffer.from(passwordBase64, 'base64').toString('ascii'),
      },
    });
    this.activeConnections[connectionId] = connection;
    return connection;
  }

  async closeConnection(externalDatabaseConnectionType) {
    const { id: connectionId } = externalDatabaseConnectionType;
    const existingConnection = this.activeConnections[connectionId];
    if (existingConnection) {
      await existingConnection.destroy();
      delete this.activeConnections[connectionId];
    }
  }
}
