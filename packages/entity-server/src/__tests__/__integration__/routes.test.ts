/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { encryptPassword, hashAndSaltPassword, getTokenClaims } from '@tupaia/auth';

import {
  findOrCreateDummyRecord,
  getTestModels,
  findOrCreateDummyCountryEntity,
} from '@tupaia/database';

import { TestableEntityServer } from '../testUtilities';

const models = getTestModels();

describe('routes', () => {
  let app;

  beforeAll(async () => {
    const { VERIFIED } = models.user.emailVerifiedStatuses;
    const userAccountEmail = 'ash-ketchum@pokemon.org';
    const userAccountPassword = 'test';

    const testPermissionGroup = await findOrCreateDummyRecord(
      models.permissionGroup,
      {
        name: 'TestPermissionGroup',
      },
      {},
    );

    const { entity: laosEntity } = await findOrCreateDummyCountryEntity(models, {
      code: 'PKM',
      name: '',
    });

    const { entity: demoEntity } = await findOrCreateDummyCountryEntity(models, {
      code: 'DL',
      name: 'Demo Land',
    });

    // Create test users
    const userAccount = await findOrCreateDummyRecord(
      models.user,
      {
        first_name: 'Ash',
        last_name: 'Ketchum',
        email: userAccountEmail,
        ...hashAndSaltPassword(userAccountPassword),
        verified_email: VERIFIED,
      },
      {},
    );

    // Test Demo Land Permission
    await findOrCreateDummyRecord(models.userEntityPermission, {
      user_id: userAccount.id,
      entity_id: demoEntity.id,
      permission_group_id: testPermissionGroup.id,
    });

    // Test Laos permission
    await findOrCreateDummyRecord(models.userEntityPermission, {
      user_id: userAccount.id,
      entity_id: laosEntity.id,
      permission_group_id: testPermissionGroup.id,
    });

    app = new TestableEntityServer(userAccountEmail, userAccountPassword);
  });

  describe('/hierarchy/<hierarchyName>/<entityCode>', () => {
    it('returns the entity', async () => {
      const { text } = await app.get('hierarchy/laos_schools/LA', {
        query: { fields: 'code,name' },
      });

      const entity = JSON.parse(text);
      expect(entity.code).toBe('LA');
      expect(entity.name).toBe('Laos');
    });
  });
});
