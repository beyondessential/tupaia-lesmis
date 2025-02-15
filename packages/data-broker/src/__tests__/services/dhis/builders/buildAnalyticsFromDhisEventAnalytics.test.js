/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { buildAnalyticsFromDhisEventAnalytics } from '../../../../services/dhis/builders/buildAnalyticsFromDhisEventAnalytics';
import { EVENT_ANALYTICS } from './buildAnalytics.fixtures';
import { createModelsStub } from '../DhisService.stubs';

const models = createModelsStub();

describe('buildAnalyticsFromDhisEventAnalytics', () => {
  it('allows empty data element codes', () => {
    expect(
      buildAnalyticsFromDhisEventAnalytics(models, EVENT_ANALYTICS.withDataValues),
    ).toResolve();
    expect(
      buildAnalyticsFromDhisEventAnalytics(models, EVENT_ANALYTICS.withDataValues, []),
    ).toResolve();
  });

  it('returns an object with `results` and `metadata` fields', async () => {
    const response = await buildAnalyticsFromDhisEventAnalytics(
      models,
      EVENT_ANALYTICS.withDataValues,
    );
    expect(response).toContainKeys(['results', 'metadata']);
  });

  describe('`results`', () => {
    const testData = [
      ['empty data element codes', [EVENT_ANALYTICS.withDataValues, []], []],
      ['empty rows', [EVENT_ANALYTICS.noDataValues, ['BCD1', 'BCD2']], []],
      [
        'non empty rows - results should be sorted by period',
        [EVENT_ANALYTICS.withDataValues, ['BCD1', 'BCD2']],
        [
          {
            period: '20200206',
            organisationUnit: 'TO_Nukuhc',
            dataElement: 'BCD1',
            value: 10,
          },
          {
            period: '20200206',
            organisationUnit: 'TO_Nukuhc',
            dataElement: 'BCD2',
            value: 'Comment 1',
          },
          {
            period: '20200207',
            organisationUnit: 'TO_HvlMCH',
            dataElement: 'BCD1',
            value: 20,
          },
          {
            period: '20200207',
            organisationUnit: 'TO_HvlMCH',
            dataElement: 'BCD2',
            value: 'Comment 2',
          },
        ],
      ],
      ['empty rows', [EVENT_ANALYTICS.noDataValues, ['BCD1', 'BCD2']], []],
    ];

    it.each(testData)('%s', (_, [eventAnalytics, dataElementCodes], value) => {
      expect(
        buildAnalyticsFromDhisEventAnalytics(models, eventAnalytics, dataElementCodes),
      ).resolves.toHaveProperty('results', value);
    });
  });

  describe('`metadata`', () => {
    it('empty data element codes', () => {
      expect(
        buildAnalyticsFromDhisEventAnalytics(models, EVENT_ANALYTICS.withDataValues),
      ).resolves.toHaveProperty('metadata', { dataElementCodeToName: {} });
    });

    it('non empty data element codes', () => {
      const dataElementCodes = ['BCD1', 'BCD2'];
      const dataElementCodeToName = {
        BCD1: 'Population',
        BCD2: 'Comment',
      };

      expect(
        buildAnalyticsFromDhisEventAnalytics(models, EVENT_ANALYTICS.emptyRows, dataElementCodes),
      ).resolves.toHaveProperty('metadata', { dataElementCodeToName });
      expect(
        buildAnalyticsFromDhisEventAnalytics(
          models,
          EVENT_ANALYTICS.withDataValues,
          dataElementCodes,
        ),
      ).resolves.toHaveProperty('metadata', { dataElementCodeToName });
    });
  });
});
