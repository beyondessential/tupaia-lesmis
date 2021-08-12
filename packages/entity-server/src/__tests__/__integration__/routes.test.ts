/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { findOrCreateDummyRecord, getTestModels } from '@tupaia/database';

import { TestableEntityServer } from '../testUtilities';

describe('routes', () => {
  describe('/hierarchy/<hierarchyName>/<entityCode>', () => {
    it('returns the entity', async () => {
      const { text } = await app.get('hierarchy/explore/TO', { query: { fields: 'code,name' } });
      const entity = JSON.parse(text);
      expect(entity.code).toBe('TO');
      expect(entity.name).toBe('Tonga');
    });
  });
});
