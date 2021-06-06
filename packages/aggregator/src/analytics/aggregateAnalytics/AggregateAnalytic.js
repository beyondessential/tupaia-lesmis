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
  aggregationChain;
  sourcePeriods;
  sourceEntities;
  aggregatePeriod;
  aggregateEntity;
  cacheKey;

  constructor(aggregationChain) {
    this.aggregationChain = aggregationChain;
  }

  getSourcePeriods() {
    if (!this.sourcePeriods) {
      this.sourcePeriods = Object.values(this.aggregationChain[0].periodMap).flat();
    }
    return this.sourcePeriods;
  }

  getSourceEntities() {
    if (!this.sourceEntities) {
      this.sourceEntities = Object.values(this.aggregationChain[0].entityMap).flat();
    }
    return this.sourceEntities;
  }

  getAggregatePeriod() {
    if (!this.aggregatePeriod) {
      this.aggregatePeriod = Object.keys(
        this.aggregationChain[this.aggregationChain.length - 1].periodMap,
      )[0];
    }
    return this.aggregatePeriod;
  }

  getAggregateEntity() {
    if (!this.aggregateEntity) {
      this.aggregateEntity = Object.keys(
        this.aggregationChain[this.aggregationChain.length - 1].entityMap,
      )[0];
    }
    return this.aggregateEntity;
  }

  toCacheKey() {
    if (!this.cacheKey) {
      console.log('building cache key');
      this.cacheKey = this.aggregationChain
        .map(aggregationToCacheKeyPart)
        .join(AGGREGATION_CHAIN_DELIMITER);
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

const aggregationToCacheKeyPart = aggregation => {
  console.log(aggregation);
  return `${aggregation.type}${AGGREGATION_PART_DELIMITER}${mapToAggregationCacheKeyPart(
    aggregation.periodMap,
  )}${AGGREGATION_PART_DELIMITER}${mapToAggregationCacheKeyPart(aggregation.entityMap)}`;
};

const mapToAggregationCacheKeyPart = map => {
  console.log(map);
  return Object.entries(map)
    .map(
      ([aggregate, sources]) =>
        `${sources.join(SOURCE_VALUES_DELIMITER)}${SOURCE_TO_AGGREGATE_DELIMITER}${aggregate}`,
    )
    .join(MAP_VALUES_DELIMITER);
};

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
