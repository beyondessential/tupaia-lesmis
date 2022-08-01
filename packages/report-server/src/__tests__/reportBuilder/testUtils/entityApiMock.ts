/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { forEach } from 'lodash';
import pick from 'lodash.pick';

export const entityApiMock = (
  entities: Record<string, Record<string, any>[]>,
  relations: Record<string, { parent: string; child: string }[]> = {},
) => {
  const getRelationsOfEntities = (
    hierarchyName: string,
    entityCodes: string[],
    queryOptions: { fields?: string[]; filter?: { type: string } } = {},
  ) => {
    const entitiesInHierarchy = entities[hierarchyName] || [];
    const relationsInHierarchy = relations[hierarchyName] || [];
    const relevantEntities = entitiesInHierarchy.filter(e => entityCodes.includes(e.code));
    const descendantEntityQueue = [...relevantEntities];
    const ancestorEntityQueue = [...relevantEntities];
    const descendantEntities = [];
    const ancestorEntities = [];
    while (descendantEntityQueue.length > 0) {
      const relevantEntity = descendantEntityQueue.shift();
      if (relevantEntity === undefined) {
        continue;
      }

      const isDefined = <T>(val: T): val is Exclude<T, undefined> => val !== undefined;
      const descendantsOfEntities = relationsInHierarchy
        .filter(({ child: childCode }) => relevantEntity.code === childCode)
        .map(({ child }) => entitiesInHierarchy.find(entity => entity.code === child))
        .filter(isDefined);

      descendantEntities.push(...descendantsOfEntities);
      descendantEntityQueue.push(...descendantsOfEntities);
    }
    console.log(descendantEntities, 'descendant entities');

    while (ancestorEntityQueue.length > 0) {
      const relevantEntity = ancestorEntityQueue.shift();
      if (relevantEntity === undefined) {
        continue;
      }

      const isDefined = <T>(val: T): val is Exclude<T, undefined> => val !== undefined;
      const ancestorsOfEntities = relationsInHierarchy
        .filter(({ parent: parentCode }) => relevantEntity.code === parentCode)
        .map(({ parent }) => entitiesInHierarchy.find(entity => entity.code === parent))
        .filter(isDefined);

      ancestorEntities.push(...ancestorsOfEntities);
      ancestorEntityQueue.push(...ancestorsOfEntities);
    }

    console.log(ancestorEntities, 'ancestor entities');

    const { fields, filter } = queryOptions;

    const filteredDescendants = filter
      ? descendantEntities.filter(entity => entity.type === filter.type)
      : descendantEntities;

    return fields ? filteredDescendants.map(e => pick(e, fields)) : filteredDescendants;
  };

  return {
    getEntity: async (
      hierarchyName: string,
      entityCode: string,
      queryOptions: { fields?: string[] } = {},
    ) => {
      const foundEntity = entities[hierarchyName]?.filter(e => entityCode.includes(e.code))[0];
      const { fields } = queryOptions;
      if (fields !== undefined) {
        interface LooseObject {
          [key: string]: any;
        }
        const foundEntityWithFields: LooseObject = {};

        fields.forEach(field => {
          foundEntityWithFields[`${field}`] = foundEntity[`${field}`];
        });

        return foundEntityWithFields;
      }
      return foundEntity;
    },
    getEntities: async (
      hierarchyName: string,
      entityCodes: string[],
      queryOptions: { fields?: string[] } = {},
    ) => {
      const foundEntities = entities[hierarchyName]?.filter(e => entityCodes.includes(e.code));
      const { fields } = queryOptions;
      return fields ? foundEntities.map(e => pick(e, fields)) : foundEntities;
    },
    getDescendantsOfEntities: async (
      hierarchyName: string,
      entityCodes: string[],
      queryOptions: { fields?: string[]; filter?: { type: string } } = {},
    ) => getRelationsOfEntities(hierarchyName, entityCodes, queryOptions),
    getRelationshipsOfEntities: async (
      hierarchyName: string,
      entityCodes: string[],
      groupBy: 'ancestor' | 'descendant' = 'ancestor',
      queryOptions: { fields?: string[]; filter?: { type: string } } = {},
      ancestorQueryOptions: { filter?: { type: string } } = {},
      descendantQueryOptions: { filter?: { type: string } } = {},
    ) => {
      const entitiesInHierarchy = entities[hierarchyName] || [];

      const ancestorEntities = ancestorQueryOptions.filter?.type
        ? getRelationsOfEntities(hierarchyName, entityCodes, ancestorQueryOptions)
        : entitiesInHierarchy.filter(e => entityCodes.includes(e.code));

      const ancestorEntityCodes = ancestorEntities.map(e => e.code);
      return ancestorEntityCodes.reduce((obj: Record<string, any[]>, ancestor) => {
        obj[ancestor] = getRelationsOfEntities(hierarchyName, [ancestor], descendantQueryOptions);
        return obj;
      }, {});
    },
    getRelativesOfEntities: async (
      hierarchyName: string,
      entityCodes: string[],
      queryOptions: { fields?: string[]; filter?: { type: string } } = {},
    ) => {
      const ancestorsByFields = getRelationsOfEntities(hierarchyName, entityCodes, queryOptions);
      return ancestorsByFields;
    },
  };
};
