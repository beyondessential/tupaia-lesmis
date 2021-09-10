/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { TestableEntityServer } from '../testUtilities';

const app = new TestableEntityServer('test@test.test', 'test');

describe('/hierarchy/<hierarchyName>/<entityCode>', () => {
  it('returns the entity', async () => {
    await expect(app.get('hierarchy/explore/TO', {})).resolves.toBe(1);
  });
});
