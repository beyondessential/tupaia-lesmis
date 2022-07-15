import supertest from 'supertest';
import { Authenticator } from '@tupaia/auth';

import { USER_SESSION_CONFIG } from '/authSession';
import sinon from 'sinon';
import { AccessPolicy } from '@tupaia/access-policy';

export const DEFAULT_API_VERSION = 1;
const getVersionedEndpoint = (endpoint, apiVersion = DEFAULT_API_VERSION) =>
  `/api/v${apiVersion}/${endpoint}`;

export class TestableApp {
  constructor(app) {
    this.app = supertest.agent(app);
    this.currentCookies = null;
  }

  async grantAccess(user, policy) {
    const accessPolicy = new AccessPolicy(policy);
    sinon
      .stub(Authenticator.prototype, 'authenticatePassword')
      .resolves({ user, accessPolicy, refreshToken: 'test' });
    sinon.stub(Authenticator.prototype, 'getAccessPolicyForUser').resolves(policy);
    return this.post('login');
  }

  revokeAccess() {
    Authenticator.prototype.authenticatePassword.restore();
  }

  get(endpoint, options, apiVersion = DEFAULT_API_VERSION) {
    const versionedEndpoint = getVersionedEndpoint(endpoint, apiVersion);
    return this.addOptionsToRequest(this.app.get(versionedEndpoint), options);
  }

  post(endpoint, options, apiVersion = DEFAULT_API_VERSION) {
    const versionedEndpoint = getVersionedEndpoint(endpoint, apiVersion);
    return this.addOptionsToRequest(this.app.post(versionedEndpoint), options);
  }

  addOptionsToRequest(request, { headers, body } = {}) {
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => request.set(key, value));
    }
    request.set('Cookie', `${USER_SESSION_CONFIG.cookieName}=${this.session}`);
    if (body) {
      request.send(body);
    }
    return request;
  }
}
