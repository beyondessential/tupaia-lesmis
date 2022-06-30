/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import keyBy from 'lodash.keyby';

import { ReqContext } from '../../../../context';

const fetchEntityObjects = async (ctx: ReqContext, hierarchy: string, codes: string[]) => {
  const entities = await ctx.services.entity.getEntities(hierarchy, codes, {
    fields: ['code', 'country_code', 'type'],
  });

  const countryOrLowerEntities = (
    await Promise.all(
      entities.map(async (entity: any) => {
        if (entity.type !== 'project') {
          return entity;
        }

        const countryEntities = await ctx.services.entity.getDescendantsOfEntities(
          hierarchy,
          codes,
          {
            fields: ['code', 'country_code', 'type'],
            filter: { type: 'country' },
          },
          false,
        );

        return countryEntities;
      }),
    )
  ).flat();

  return Object.values(keyBy(countryOrLowerEntities, 'code'));
};

export const buildOrganisationUnitParams = async (
  ctx: ReqContext,
  config: { organisationUnits: string[] },
) => {
  const { hierarchy, accessPolicy, permissionGroup } = ctx;
  const { organisationUnits: codesToFetch } = config;

  if (codesToFetch.length === 0) {
    throw new Error(
      "Must provide 'organisationUnitCodes' URL parameter, or 'organisationUnits' in fetch config",
    );
  }

  const fetchedEntities: any[] = await fetchEntityObjects(ctx, hierarchy, codesToFetch);

  const codesWithAccess = fetchedEntities
    .filter(({ country_code }) => country_code !== null)
    .filter(({ country_code }) =>
      accessPolicy.allows(country_code as Exclude<typeof country_code, null>, permissionGroup),
    )
    .map(({ code }) => code);

  if (codesWithAccess.length === 0) {
    throw new Error(`No '${permissionGroup}' access to any one of entities: ${codesToFetch}`);
  }

  return codesWithAccess;
};
