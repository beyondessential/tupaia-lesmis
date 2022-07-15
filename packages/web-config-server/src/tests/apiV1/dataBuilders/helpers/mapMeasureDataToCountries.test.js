/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */
import { expect } from 'chai';
import { getTestModels } from '../../../getTestModels';
import { upsertDummyRecord } from '@tupaia/database';

import { mapMeasureDataToCountries } from '/apiV1/measureBuilders/helpers';

const ANALYTICS = [
  {
    organisationUnitCode: '_test_facility',
    dataValues: [{ dataElement: 'A', value: '1' }],
  },
  {
    organisationUnitCode: '_test_facility',
    dataValues: [{ dataElement: 'A', value: '2' }],
  },
  {
    organisationUnitCode: '_test_facility',
    dataValues: [{ dataElement: 'A', value: '3' }],
  },
];
const ENTITY_COUNTRY_CODE = 'DL';
let models;

describe('mapMeasureDataToCountries()', () => {
  before(async () => {
    models = getTestModels();
    await upsertDummyRecord(models.entity, {
      code: '_test_facility',
      country_code: ENTITY_COUNTRY_CODE,
    });
  });

  it('replace facility orgUnit codes with their corresponding country codes', async () => {
    const countryAnalytics = await mapMeasureDataToCountries(models, ANALYTICS);
    countryAnalytics.forEach(analytic => {
      expect(analytic.organisationUnitCode).to.equal(ENTITY_COUNTRY_CODE);
    });
  });
});
