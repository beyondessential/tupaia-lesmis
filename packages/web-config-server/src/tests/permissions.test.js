/**
 * Tupaia MediTrak
 * Copyright (c) 2017 Beyond Essential Systems Pty Ltd
 */

import { findOrCreateDummyRecord, generateId } from '@tupaia/database';
import { expect } from 'chai';
import { createApp } from '../app';
import { getTestModels } from './getTestModels';
import { TestableApp } from './TestableApp';

const policy = {
  testDL: ['Public', 'Admin'],
  testTO: ['Admin'],
};

const user = {
  id: 'testuser@test.com',
  fullName: 'Test User',
  email: 'testuser@test.com',
  verified_email: 'testuser@test.com',
};

describe('UserHasAccess', function () {
  let app;

  before(async () => {
    const models = getTestModels();
    const hiearchyId = generateId();
    const projectEntityId = generateId();
    const testDLId = generateId();
    const worldId = generateId();
    const testTOId = generateId();
    const testTOFacilityId = generateId();
    await findOrCreateDummyRecord(models.country, {
      code: 'test_DL',
      name: 'Test DL',
    });
    await findOrCreateDummyRecord(models.country, {
      code: 'test_TO',
      name: 'Test TO',
    });
    await findOrCreateDummyRecord(models.entity, {
      id: worldId,
      code: 'test_World',
      parent_id: null,
      type: 'world',
      country_code: null,
    });
    await findOrCreateDummyRecord(models.entity, {
      id: projectEntityId,
      code: 'test_demo',
      parent_id: worldId,
      type: 'project',
      country_code: null,
    });
    await findOrCreateDummyRecord(models.entity, {
      id: testDLId,
      code: 'testDL',
      type: 'country',
      parent_id: worldId,
      country_code: 'testDL',
    });
    await findOrCreateDummyRecord(models.entity, {
      id: testTOId,
      code: 'testTO',
      type: 'country',
      parent_id: worldId,
      country_code: 'testTO',
    });
    await findOrCreateDummyRecord(models.entity, {
      id: testTOFacilityId,
      code: 'testTO_FACILICY',
      type: 'district',
      parent_id: testTOId,
      country_code: 'testTO',
    });
    await findOrCreateDummyRecord(models.entityHierarchy, {
      id: hiearchyId,
      name: 'test_demo',
      canonical_types: `{${['country'].join(', ')}}`,
    });
    await findOrCreateDummyRecord(models.entityRelation, {
      entity_hierarchy_id: hiearchyId,
      parent_id: projectEntityId,
      child_id: testDLId,
    });
    await findOrCreateDummyRecord(models.entityRelation, {
      entity_hierarchy_id: hiearchyId,
      parent_id: projectEntityId,
      child_id: testTOId,
    });
    // await findOrCreateDummyRecord(models.entityRelation, {
    //   entity_hierarchy_id: hiearchyId,
    //   parent_id: testTOId,
    //   child_id: testTOFacilityId,
    // });
    await findOrCreateDummyRecord(models.project, {
      code: 'test_demo',
      permission_groups: `{${['Public'].join(', ')}}`,
      entity_hierarchy_id: hiearchyId,
      config: {
        // frontendExcluded: [
        //   {
        //     types: ['facility'],
        // exceptions: {
        //   permissionGroups: ['Admin'],
        // },
        // },
        // ],
      },
    });

    const baseApp = await createApp();
    app = new TestableApp(baseApp);
    return app.grantAccess(user, policy);
  });

  describe('access policy', () => {
    it('should allow users have Admin permission group to access to Tonga', async () => {
      const response = await app.get(
        'organisationUnit?organisationUnitCode=test_World&projectCode=test_demo&includeCountryData=true',
      );
      const { countryCode, organisationUnitChildren } = response.body;
      expect(countryCode).to.equal('testTO');
      expect(organisationUnitChildren.length).to.greaterThan(0);
    });
  });

  xit('should only retrieve public level dashboards for Tonga org units unless Access Policy otherwise specifies', async () => {
    const tongaDashboardResponse = await app
      .get('dashboard?organisationUnitCode=testTO&projectCode=explore')
      .expect(200);
    expect(tongaDashboardResponse.body).to.have.all.keys('General');
    expect(tongaDashboardResponse.body).to.not.have.any.keys('PEHS');

    const niuasDashboardResponse = await app
      .get('dashboard?organisationUnitCode=TO_Niuas&projectCode=explore')
      .expect(200);
    expect(niuasDashboardResponse.body).to.have.all.keys('General');
    expect(niuasDashboardResponse.body).to.not.have.any.keys('PEHS');

    const tongatapuDashboardResponse = await app
      .get('dashboard?organisationUnitCode=TO_Tongatapu&projectCode=explore')
      .expect(200);
    expect(tongatapuDashboardResponse.body).to.have.all.keys('General', 'PEHS');
  });
  xit('should not have access to donor level measure group for top-level Tonga organisation unit', async () => {
    const tongaDashboardResponse = await app
      .get('measures?organisationUnitCode=testTO')
      .expect(200);

    expect(tongaDashboardResponse.body.measures).to.not.have.property('Facility equipment');
  });
  xit('should not have access to donor level measure group for organisation unit that does not have any donor level permissions', async () => {
    const niuasDashboardResponse = await app
      .get('measures?organisationUnitCode=TO_Niuas&projectCode=explore')
      .expect(200);
    expect(niuasDashboardResponse.body.measures).to.not.have.property('Facility equipment');
  });
  xit('should have access to donor level measure group for nested organisation unit with donor level permissions', async () => {
    const tongaDashboardResponse = await app
      .get('measures?organisationUnitCode=TO_Tongatapu&projectCode=explore')
      .expect(200);

    expect(tongaDashboardResponse.body.measures).to.have.property('Facility equipment');
    expect(tongaDashboardResponse.body.measures['Facility equipment']).to.deep.include({
      measureId: 1,
      name: 'Adult weighing scale',
    });
  });
  xit('should reveal public level measure data', async () => {
    const measureDataResponse = await app
      .get('measureData?organisationUnitCode=testTO&measureId=126')
      .expect(200);

    expect(measureDataResponse.body.displayType).to.equal('dot');
    expect(measureDataResponse.body.measureId).to.equal(126);
    expect(measureDataResponse.body.measureOptions).to.deep.include({ name: 'open', value: '0' });
  });
  xit('should not reveal donor level measure data for organisation units that the user does not have access to', async () => {
    await app.get('measureData?organisationUnitCode=testTO&measureId=7').expect(401);
  });
  xit('should reveal donor level measure data for organisation units that the user has access to', async () => {
    await app.get('measureData?organisationUnitCode=TO_Tongatapu&measureId=7').expect(200);
  });
});
