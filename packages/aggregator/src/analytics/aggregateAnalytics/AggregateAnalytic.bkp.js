/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

const AGGREGATION_CHAIN_DELIMITER = '=>';
const AGGREGATION_PART_DELIMITER = '|';
const SOURCE_VALUES_DELIMITER = ';';
const SOURCE_TO_AGGREGATE_DELIMITER = '->';
const MAP_VALUES_DELIMITER = '&&';

export class AggregateAnalytic {
  cacheKey;

  constructor(
    dataElement,
    sourceAnalyticIds,
    inputPeriods,
    outputPeriod,
    inputEntities,
    outputEntity,
    aggregation,
  ) {
    this.dataElement = dataElement;
    this.sourceAnalyticIds = sourceAnalyticIds;
    this.inputPeriods = inputPeriods;
    this.outputPeriod = outputPeriod;
    this.inputEntities = inputEntities;
    this.outputEntity = outputEntity;
    this.aggregation = aggregation;
  }

  toCacheKey() {
    if (!this.cacheKey) {
      console.log('building cache key');
      this.cacheKey = `${this.dataElement}${AGGREGATION_PART_DELIMITER}${
        this.aggregation
      }${AGGREGATION_PART_DELIMITER}${this.sourceAnalyticIds.join(
        SOURCE_VALUES_DELIMITER,
      )}${AGGREGATION_PART_DELIMITER}`;
    }
    console.log('built', this.cacheKey);
    return this.cacheKey;
  }

  static fromCacheKey(cacheKey) {
    const aggregationChain = cacheKey
      .split(AGGREGATION_CHAIN_DELIMITER)
      .map(cacheKeyPartToAggregation);
    return new AggregateAnalytic(aggregationChain);
  }
}

const cacheKeyPartToAggregation = cacheKeyPart => {
  const [type, periodPart, entityPart] = cacheKeyPart.split(AGGREGATION_PART_DELIMITER);
  return {
    type,
    periodMap: aggregationCacheKeyPartToMap(periodPart),
    entityMap: aggregationCacheKeyPartToMap(entityPart),
  };
};

const aggregationCacheKeyPartToMap = aggregationCacheKeyPart =>
  aggregationCacheKeyPart
    .split(MAP_VALUES_DELIMITER)
    .map(mapValueString => mapValueString.split(SOURCE_TO_AGGREGATE_DELIMITER))
    .reduce((map, [sourceValuesString, aggregate]) => {
      map[aggregate] = sourceValuesString.split(SOURCE_VALUES_DELIMITER);
      return map;
    }, {});
