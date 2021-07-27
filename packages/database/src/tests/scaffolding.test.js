/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import chai from 'chai';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import moment from 'moment';
import sinonChai from 'sinon-chai';
import winston from 'winston';

import { configureWinstonForTests } from '@tupaia/utils';
import { clearTestData, getTestDatabase } from '../testUtilities';

before(() => {
  configureWinstonForTests(winston);

  chai.use(deepEqualInAnyOrder);
  chai.use(sinonChai);
});

const testStartTime = moment().format('YYYY-MM-DD HH:mm:ss');
after(async () => {
  const database = getTestDatabase();
  await clearTestData(database, testStartTime);
  await database.closeConnections();
});
