/* eslint-disable consistent-return */
/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */
import { ModelRegistry, AnalyticRecord } from '../types';
import { IndicatorCache } from './IndicatorCache';

const CLEANER_DEBOUNCE_TIME = 500; // wait 0.5 second after changes before cleaning, to avoid double-up

type ParsedAnalyticRecord = {
  entityCode: string;
  dataElementCode: string;
  dayPeriod: string;
  weekPeriod: string;
  monthPeriod: string;
  yearPeriod: string;
};

type Job = {
  analytic: ParsedAnalyticRecord;
  resolve?: (value?: unknown) => void;
};

class Queue<T> {
  store: T[] = [];

  push(val: T) {
    this.store.push(val);
  }

  pop(): T | undefined {
    return this.store.shift();
  }
}

export class IndicatorCacheCleaner {
  private readonly models: ModelRegistry;

  private readonly indicatorCache: IndicatorCache;

  private changeHandlerCancellers: any[];

  private scheduledCleanJobs: Queue<Job>;

  private scheduledCleanTimeout: NodeJS.Timeout | null;

  constructor(models: ModelRegistry) {
    this.models = models;
    this.indicatorCache = IndicatorCache.getInstance();
    this.changeHandlerCancellers = [];
    this.scheduledCleanJobs = new Queue();
    this.scheduledCleanTimeout = null;
  }

  listenForChanges() {
    this.changeHandlerCancellers = [
      this.models.analytics.addChangeHandler(this.handleAnalyticsChange),
    ];
  }

  stopListeningForChanges() {
    this.changeHandlerCancellers.forEach(c => c());
    this.changeHandlerCancellers = [];
  }

  handleAnalyticsChange = async ({
    old_record,
    new_record,
  }: {
    old_record: AnalyticRecord | null;
    new_record: AnalyticRecord | null;
  }) => {
    if (!old_record && !new_record) {
      return;
    }

    if (!old_record && new_record) {
      return this.scheduleIndicatorCacheClean({
        entityCode: new_record.entity_code,
        dataElementCode: new_record.data_element_code,
        dayPeriod: new_record.day_period,
        weekPeriod: new_record.week_period,
        monthPeriod: new_record.month_period,
        yearPeriod: new_record.year_period,
      });
    }

    if (!new_record && old_record) {
      return this.scheduleIndicatorCacheClean({
        entityCode: old_record.entity_code,
        dataElementCode: old_record.data_element_code,
        dayPeriod: old_record.day_period,
        weekPeriod: old_record.week_period,
        monthPeriod: old_record.month_period,
        yearPeriod: old_record.year_period,
      });
    }

    return Promise.all([
      this.scheduleIndicatorCacheClean({
        entityCode: new_record.entity_code,
        dataElementCode: new_record.data_element_code,
        dayPeriod: new_record.day_period,
        weekPeriod: new_record.week_period,
        monthPeriod: new_record.month_period,
        yearPeriod: new_record.year_period,
      }),
      this.scheduleIndicatorCacheClean({
        entityCode: old_record.entity_code,
        dataElementCode: old_record.data_element_code,
        dayPeriod: old_record.day_period,
        weekPeriod: old_record.week_period,
        monthPeriod: old_record.month_period,
        yearPeriod: old_record.year_period,
      }),
    ]);
  };

  // add the hierarchy to the list to be rebuilt, with a debounce so that we don't rebuild
  // many times for a bulk lot of changes
  scheduleIndicatorCacheClean(analytic: ParsedAnalyticRecord) {
    const promiseForJob = new Promise(resolve => {
      this.scheduledCleanJobs.push({ analytic, resolve });
    });

    // clear any previous scheduled rebuild, so that we debounce all changes in the same time period
    if (this.scheduledCleanTimeout) {
      clearTimeout(this.scheduledCleanTimeout);
    }

    // schedule the rebuild to happen after an adequate period of debouncing
    this.scheduledCleanTimeout = setTimeout(this.runScheduledClean, CLEANER_DEBOUNCE_TIME);

    // return the promise for the caller to await
    return promiseForJob;
  }

  runScheduledClean = async () => {
    // remove timeout so any jobs added now get scheduled anew
    this.scheduledCleanTimeout = null;

    // retrieve the current set of jobs
    const jobs = this.scheduledCleanJobs;
    this.scheduledCleanJobs = new Queue();

    // get the subtrees to delete, then run the delete
    const analyticsForDeletion: string[] = [];
    const resolves: ((value?: unknown) => void)[] = [];
    let job: Job | undefined;
    // eslint-disable-next-line no-cond-assign
    while ((job = jobs.pop())) {
      const { analytic, resolve } = job;
      if (resolve) {
        resolves.push(resolve);
      }

      console.log(analytic);
      const indicatorsForAnalytic = await this.indicatorCache.getRelations(
        analytic.dataElementCode,
        analytic.dayPeriod,
        analytic.entityCode,
      );
      analyticsForDeletion.push(...indicatorsForAnalytic);
      indicatorsForAnalytic.forEach(indicatorCacheKey => {
        const { dataElement, period, organisationUnit } = IndicatorCache.splitAnalyticKey(
          indicatorCacheKey,
        );
        jobs.push({
          analytic: {
            dataElementCode: dataElement,
            entityCode: organisationUnit,
            dayPeriod: period,
            weekPeriod: period,
            monthPeriod: period,
            yearPeriod: period,
          },
        });
      });
    }

    console.log(analyticsForDeletion);
    if (analyticsForDeletion.length > 0) {
      await this.indicatorCache.deleteAnalytics(analyticsForDeletion);
    }

    // resolve all jobs
    resolves.forEach(resolve => resolve());
  };
}
