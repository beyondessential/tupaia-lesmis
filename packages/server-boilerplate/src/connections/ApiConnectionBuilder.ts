/*
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 *
 */
import { MicroserviceApi, AuthHandler } from './types';
import { ApiConnection } from './ApiConnection';
import { OutboundConnection } from './OutboundConnection';

export class ApiConnectionBuilder {
  private outboundConnection?: OutboundConnection;

  private authHandler?: AuthHandler;

  public useConnection(outboundConnection: OutboundConnection) {
    this.outboundConnection = outboundConnection;
    return this;
  }

  public handleAuthWith(authHandler: AuthHandler) {
    this.authHandler = authHandler;
    return this;
  }

  public buildAs<Wrapper extends MicroserviceApi>(
    WrapperClazz: new (apiConnection: ApiConnection) => Wrapper,
  ) {
    if (!this.authHandler) {
      throw new Error('Must specify an authHandler when building an ApiConnection');
    }

    const apiConnection = new ApiConnection(this.authHandler, this.outboundConnection);
    const wrappedApiConnection = new WrapperClazz(apiConnection);
    apiConnection.baseUrl = wrappedApiConnection.baseUrl;
    return wrappedApiConnection;
  }
}
