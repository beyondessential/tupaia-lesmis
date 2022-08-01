/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { AccessPolicy } from '@tupaia/access-policy';

import { buildContext, ReqContext } from '../../../reportBuilder/context/buildContext';

import { entityApiMock } from '../testUtils';

describe('buildContext', () => {
  const HIERARCHY = 'test_hierarchy';
  const ENTITIES = {
    test_hierarchy: [
      { id: 'ouId1', code: 'AU', name: 'Australia', type: 'country' },
      { id: 'ouId2', code: 'FJ', name: 'Fiji', type: 'country' },
      { id: 'ouId3', code: 'KI', name: 'Kiribati', type: 'country' },
      { id: 'ouId4', code: 'TO', name: 'Tonga', type: 'country' },
      { id: 'ouId5', code: 'TO_Facility1', name: 'Tonga Facility 1', type: 'facility' },
      { id: 'ouId6', code: 'TO_Facility2', name: 'Tonga Facility 2', type: 'facility' },
      { id: 'ouId7', code: 'FJ_Facility', name: 'Fiji Facility', type: 'facility' },
      { id: 'ouId8', code: 'FJ_Village1', name: 'Fiji Village 1', type: 'village' },
      { id: 'ouId9', code: 'FJ_Village2', name: 'Fiji Village 2', type: 'village' },
      { id: 'ouId10', code: 'FJ_Ind1', name: 'Fiji Individual 1', type: 'individual' },
      { id: 'ouId11', code: 'FJ_Ind2', name: 'Fiji Individual 2', type: 'individual' },
      { id: 'ouId12', code: 'TO_Ind1', name: 'Tonga Individual 1', type: 'individual' },
      { id: 'ouId13', code: 'TO_Ind2', name: 'Tonga Individual 2', type: 'individual' },
      { id: 'ouId14', code: 'TO_District1', name: 'Tonga District 1', type: 'district' },
      { id: 'ouId15', code: 'TO_District2', name: 'Tonga District 2', type: 'district' },
    ],
  };

  const RELATIONS = {
    test_hierarchy: [
      { parent: 'TO', child: 'TO_Facility1' },
      { parent: 'TO', child: 'TO_Facility2' },
      { parent: 'FJ', child: 'FJ_Facility' },
      { parent: 'FJ_Facility', child: 'FJ_Village1' },
      { parent: 'FJ_Facility', child: 'FJ_Village2' },
      { parent: 'FJ_Village1', child: 'FJ_Ind1' },
      { parent: 'FJ_Village2', child: 'FJ_Ind2' },
      { parent: 'TO_District1', child: 'TO_Ind1' },
      { parent: 'TO_District2', child: 'TO_Ind2' },
    ],
  };

  const apiMock = entityApiMock(ENTITIES, RELATIONS);

  const reqContext: ReqContext = {
    hierarchy: HIERARCHY,
    permissionGroup: 'Public',
    services: {
      entity: apiMock,
    } as ReqContext['services'],
    accessPolicy: new AccessPolicy({ AU: ['Public'] }),
  };

  describe('orgUnits', () => {
    it('builds orgUnits using fetched analytics', async () => {
      const transform = [
        {
          insert: {
            name: '=orgUnitCodeToName($organisationUnit)',
          },
          transform: 'updateColumns',
        },
      ];
      const analytics = [
        { dataElement: 'BCD1', organisationUnit: 'TO', period: '20210101', value: 1 },
        { dataElement: 'BCD1', organisationUnit: 'FJ', period: '20210101', value: 2 },
      ];
      const data = { results: analytics };

      const context = await buildContext(transform, reqContext, data);
      const expectedContext = {
        orgUnits: [
          { id: 'ouId2', code: 'FJ', name: 'Fiji', attributes: {} },
          { id: 'ouId4', code: 'TO', name: 'Tonga', attributes: {} },
        ],
      };
      expect(context).toStrictEqual(expectedContext);
    });

    it('builds orgUnits using fetched events', async () => {
      const transform = [
        {
          insert: {
            name: '=orgUnitCodeToName($orgUnit)',
          },
          transform: 'updateColumns',
        },
      ];
      const events = [
        { event: 'evId1', eventDate: '2021-01-01T12:00:00', orgUnit: 'TO', orgUnitName: 'Tonga' },
        { event: 'evId2', eventDate: '2021-01-01T12:00:00', orgUnit: 'FJ', orgUnitName: 'Fiji' },
      ];
      const data = { results: events };

      const context = await buildContext(transform, reqContext, data);
      const expectedContext = {
        orgUnits: [
          { id: 'ouId2', code: 'FJ', name: 'Fiji', attributes: {} },
          { id: 'ouId4', code: 'TO', name: 'Tonga', attributes: {} },
        ],
      };
      expect(context).toStrictEqual(expectedContext);
    });

    it('org units include attributes', async () => {
      const transform = [
        {
          insert: {
            name: '=orgUnitCodeToName($organisationUnit)',
          },
          transform: 'updateColumns',
        },
      ];
      const analytics = [
        { dataElement: 'BCD1', organisationUnit: 'TO_Facility1', period: '20210101', value: 1 },
      ];
      const data = { results: analytics };

      const context = await buildContext(transform, reqContext, data);
      const expectedContext = {
        orgUnits: [
          { id: 'ouId5', code: 'TO_Facility1', name: 'Tonga Facility 1', attributes: { x: 1 } },
        ],
      };
      expect(context).toStrictEqual(expectedContext);
    });

    it('ignores unknown entities', async () => {
      const transform = [
        {
          insert: {
            name: '=orgUnitCodeToName($organisationUnit)',
          },
          transform: 'updateColumns',
        },
      ];
      const analytics = [
        { dataElement: 'BCD1', organisationUnit: 'Unknown_entity', period: '20210101', value: 1 },
      ];
      const data = { results: analytics };

      const context = await buildContext(transform, reqContext, data);
      const expectedContext = {
        orgUnits: [],
      };
      expect(context).toStrictEqual(expectedContext);
    });
  });

  describe('dataElementCodeToName', () => {
    it('includes dataElementCodeToName from fetched data', async () => {
      const transform = [
        {
          insert: {
            name: '=dataElementCodeToName($dataElement)',
          },
          transform: 'updateColumns',
        },
      ];
      const analytics = [
        { dataElement: 'BCD1', organisationUnit: 'TO', period: '20210101', value: 1 },
        { dataElement: 'BCD2', organisationUnit: 'FJ', period: '20210101', value: 2 },
      ];
      const data = {
        results: analytics,
        metadata: {
          dataElementCodeToName: { BCD1: 'Facility Status', BCD2: 'Reason for closure' },
        },
      };

      const context = await buildContext(transform, reqContext, data);
      const expectedContext = {
        dataElementCodeToName: { BCD1: 'Facility Status', BCD2: 'Reason for closure' },
      };
      expect(context).toStrictEqual(expectedContext);
    });

    it('builds an empty object when using fetch events', async () => {
      const transform = [
        {
          insert: {
            name: '=dataElementCodeToName($dataElement)',
          },
          transform: 'updateColumns',
        },
      ];
      const events = [
        { event: 'evId1', eventDate: '2021-01-01T12:00:00', orgUnit: 'TO', orgUnitName: 'Tonga' },
        { event: 'evId2', eventDate: '2021-01-01T12:00:00', orgUnit: 'FJ', orgUnitName: 'Fiji' },
      ];
      const data = { results: events };

      const context = await buildContext(transform, reqContext, data);
      const expectedContext = { dataElementCodeToName: {} };
      expect(context).toStrictEqual(expectedContext);
    });
  });

  describe('facilityCountByOrgUnit', () => {
    it('builds facilityCountByOrgUnit using fetched analytics', async () => {
      const transform = ['insertNumberOfFacilitiesColumn'];

      const analytics = [
        { dataElement: 'BCD1', organisationUnit: 'TO', period: '20210101', value: 1 },
        { dataElement: 'BCD1', organisationUnit: 'FJ', period: '20210101', value: 2 },
        { dataElement: 'BCD1', organisationUnit: 'AU', period: '20210101', value: 2 },
      ];
      const data = { results: analytics };

      const context = await buildContext(transform, reqContext, data);
      const expectedContext = {
        facilityCountByOrgUnit: {
          TO: 2,
          FJ: 1,
          AU: 0,
        },
      };
      expect(context).toStrictEqual(expectedContext);
    });

    it('builds facilityCountByOrgUnit using fetched events', async () => {
      const transform = ['insertNumberOfFacilitiesColumn'];
      const events = [
        { event: 'evId1', eventDate: '2021-01-01T12:00:00', orgUnit: 'TO', orgUnitName: 'Tonga' },
        { event: 'evId2', eventDate: '2021-01-01T12:00:00', orgUnit: 'FJ', orgUnitName: 'Fiji' },
      ];
      const data = { results: events };

      const context = await buildContext(transform, reqContext, data);
      const expectedContext = {
        facilityCountByOrgUnit: {
          TO: 2,
          FJ: 1,
        },
      };
      expect(context).toStrictEqual(expectedContext);
    });

    it('ignores unknown entities', async () => {
      const transform = ['insertNumberOfFacilitiesColumn'];
      const analytics = [
        { dataElement: 'BCD1', organisationUnit: 'Unknown_entity', period: '20210101', value: 1 },
      ];
      const data = { results: analytics };

      const context = await buildContext(transform, reqContext, data);
      const expectedContext = {
        facilityCountByOrgUnit: {},
      };
      expect(context).toStrictEqual(expectedContext);
    });
  });

  describe('ancestor property from org unit code', () => {
    it('builds ancestor village code using fetched analytics', async () => {
      const transform = [
        {
          insert: {
            villageCode: "=orgUnitCodeToAncestorVillageProperty($organisationUnit,'code')",
          },
          transform: 'updateColumns',
        },
      ];
      const analytics = [
        { dataElement: 'BCD1', organisationUnit: 'FJ_Ind1', period: '20210101', value: 1 },
        { dataElement: 'BCD1', organisationUnit: 'FJ_Ind2', period: '20210101', value: 2 },
      ];
      const data = { results: analytics };

      const context = await buildContext(transform, reqContext, data);
      const expectedContext = {
        ancestorVillages: [
          {
            code: 'FJ_Village1',
            name: 'Fiji Village 1',
          },
          {
            code: 'FJ_Village2',
            name: 'Fiji Village 2',
          },
        ],
        ancestorVillagesMap: {
          FJ_Village1: [
            {
              code: 'FJ',
              id: 'ouId2',
              name: 'Fiji',
              type: 'country',
            },
          ],
          FJ_Village2: [
            {
              code: 'FJ',
              id: 'ouId2',
              name: 'Fiji',
              type: 'country',
            },
          ],
        },
      };
      expect(context).toStrictEqual(expectedContext);
    });

    it('builds ancestor district name using fetched analytics', async () => {
      const transform = [
        {
          insert: {
            villageCode: "=orgUnitCodeToAncestorDistrictProperty($organisationUnit,'name')",
          },
          transform: 'updateColumns',
        },
      ];
      const analytics = [
        { dataElement: 'BCD1', organisationUnit: 'TO_Ind1', period: '20210101', value: 1 },
        { dataElement: 'BCD1', organisationUnit: 'TO_Ind2', period: '20210101', value: 2 },
      ];
      const data = { results: analytics };

      const context = await buildContext(transform, reqContext, data);
      const expectedContext = {
        ancestorVillages: [
          {
            code: 'TO_District1',
            name: 'Tonga District 1',
          },
          {
            code: 'TO_District2',
            name: 'Tonga District 2',
          },
        ],
        ancestorVillagesMap: {
          TO_Ind1: [
            {
              code: 'TO_District1',
              id: 'ouId14',
              name: 'Tonga District 1',
              type: 'district',
            },
          ],
          TO_Ind2: [
            {
              code: 'TO_District2',
              id: 'ouId15',
              name: 'Tonga District 2',
              type: 'district',
            },
          ],
        },
      };
      expect(context).toStrictEqual(expectedContext);
    });
  });
});
