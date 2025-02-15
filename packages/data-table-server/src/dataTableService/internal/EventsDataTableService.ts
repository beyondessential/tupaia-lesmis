/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { AccessPolicy } from '@tupaia/access-policy';
import { Aggregator } from '@tupaia/aggregator';
import { TupaiaApiClient } from '@tupaia/api-client';
import { DataBroker } from '@tupaia/data-broker';
import { EARLIEST_DATA_DATE_STRING, yup } from '@tupaia/utils';
import { DataTableService } from '../DataTableService';
import { yupSchemaToDataTableParams } from '../utils';

const paramsSchema = yup.object().shape({
  hierarchy: yup.string().default('explore'),
  dataGroupCode: yup.string().required(),
  dataElementCodes: yup.array().of(yup.string().required()).strict(),
  organisationUnitCodes: yup.array().of(yup.string().required()).strict().required(),
  startDate: yup.date().default(new Date(EARLIEST_DATA_DATE_STRING)),
  endDate: yup.date().default(() => new Date()),
  aggregations: yup.array().of(
    yup.object().shape({
      type: yup.string().required(),
      config: yup.object(),
    }),
  ),
});

const configSchema = yup.object();

type EventsDataTableServiceContext = {
  apiClient: TupaiaApiClient;
  accessPolicy: AccessPolicy;
};

type EventFields = {
  event: string;
  eventDate: string;
  orgUnit: string;
  orgUnitName: string;
};

type RawEvent = EventFields & {
  dataValues: Record<string, unknown>;
};
type Event = EventFields & Record<string, unknown>;

/**
 * DataTableService for pulling data from data-broker's fetchEvents() endpoint
 */
export class EventsDataTableService extends DataTableService<
  EventsDataTableServiceContext,
  typeof paramsSchema,
  typeof configSchema,
  Event
> {
  public constructor(context: EventsDataTableServiceContext, config: unknown) {
    super(context, paramsSchema, configSchema, config);
  }

  protected async pullData(params: {
    hierarchy: string;
    dataGroupCode: string;
    dataElementCodes?: string[];
    organisationUnitCodes: string[];
    startDate?: Date;
    endDate?: Date;
    aggregations?: { type: string; config?: Record<string, unknown> }[];
  }) {
    const {
      hierarchy,
      dataGroupCode,
      dataElementCodes,
      organisationUnitCodes,
      startDate,
      endDate,
      aggregations,
    } = params;

    const startDateString = startDate ? startDate.toISOString() : undefined;
    const endDateString = endDate ? endDate.toISOString() : undefined;

    const aggregator = new Aggregator(
      new DataBroker({
        services: this.ctx.apiClient,
        accessPolicy: this.ctx.accessPolicy,
      }),
    );

    const response = (await aggregator.fetchEvents(
      dataGroupCode,
      {
        hierarchy,
        organisationUnitCodes,
        startDate: startDateString,
        endDate: endDateString,
        dataElementCodes,
      },
      aggregations,
    )) as RawEvent[];
    return response.map(event => {
      const { dataValues, ...restOfEvent } = event;
      return { ...dataValues, ...restOfEvent };
    });
  }

  public getParameters() {
    // Not including aggregations, as they are a hidden parameter
    const {
      hierarchy,
      organisationUnitCodes,
      dataGroupCode,
      dataElementCodes,
      startDate,
      endDate,
    } = yupSchemaToDataTableParams(paramsSchema);

    return [
      { name: 'hierarchy', config: hierarchy },
      {
        name: 'organisationUnitCodes',
        config: organisationUnitCodes,
      },
      { name: 'dataGroupCode', config: dataGroupCode },
      { name: 'dataElementCodes', config: dataElementCodes },
      {
        name: 'startDate',
        config: startDate,
      },
      {
        name: 'endDate',
        config: endDate,
      },
    ];
  }
}

export const createEventsDataTableService = (
  context: EventsDataTableServiceContext,
  config: unknown,
) => new EventsDataTableService(context, config);
