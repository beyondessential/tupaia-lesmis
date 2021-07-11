/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

const AGGREGATION_CHAIN_DELIMITER = '=>';
const AGGREGATION_PART_DELIMITER = '|';
const SOURCE_VALUES_DELIMITER = ';';
const SOURCE_TO_AGGREGATE_DELIMITER = '->';
const MAP_VALUES_DELIMITER = '&&';

export class SourceAnalytic {
  cacheKey;

  constructor(dataElement, period, entity) {
    this.dataElement = dataElement;
    this.period = period;
    this.inputPeriods = [period];
    this.outputPeriod = period;
    this.entity = entity;
    this.inputEntities = [entity];
    this.outputEntity = entity;
  }

  toCacheKey() {
    if (!this.cacheKey) {
      this.cacheKey = `${this.dataElement}${AGGREGATION_PART_DELIMITER}SOURCE${AGGREGATION_PART_DELIMITER}${this.period}${AGGREGATION_PART_DELIMITER}${this.entity}`;
    }
    return this.cacheKey;
  }

  static fromCacheKey(cacheKey) {
    const aggregationChain = cacheKey
      .split(AGGREGATION_CHAIN_DELIMITER)
      .map(cacheKeyPartToAggregation);
    return new AggregateAnalytic(aggregationChain);
  }
}

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
