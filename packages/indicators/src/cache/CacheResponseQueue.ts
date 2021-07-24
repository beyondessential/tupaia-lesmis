/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { AnalyticValue } from '../types';
import { IndicatorAnalytic } from './types';

export type IndicatorResponse = {
  requested: IndicatorAnalytic;
  value: AnalyticValue | undefined;
};

export class CacheResponseQueue {
  private responses: IndicatorResponse[];

  private readonly pendingResponseValuePromises: Record<string, Promise<AnalyticValue | undefined>>;

  private readonly pendingResponseValueResolves: Record<
    string,
    (analytic: AnalyticValue | undefined) => void
  >;

  private readonly onComplete: (responses: IndicatorResponse[]) => void | Promise<void>;

  public constructor(onComplete: (responses: IndicatorResponse[]) => void | Promise<void>) {
    this.onComplete = onComplete;
    this.responses = [];
    this.pendingResponseValuePromises = {};
    this.pendingResponseValueResolves = {};
  }

  public checkQueue(key: string) {
    const promise = this.pendingResponseValuePromises[key];
    if (promise) {
      return promise;
    }

    return undefined;
  }

  public enqueue(key: string) {
    const promise = new Promise((resolve: (analytic: AnalyticValue | undefined) => void) => {
      this.pendingResponseValueResolves[key] = resolve;
    });
    this.pendingResponseValuePromises[key] = promise;
  }

  public dequeue(key: string, analytic: IndicatorAnalytic, value: AnalyticValue | undefined) {
    const resolve = this.pendingResponseValueResolves[key];
    this.responses.push({ requested: analytic, value });
    delete this.pendingResponseValuePromises[key];
    delete this.pendingResponseValueResolves[key];
    resolve(value);

    if (Object.keys(this.pendingResponseValuePromises).length === 0) {
      this.onComplete(this.responses);
      this.responses = [];
    }
  }
}
