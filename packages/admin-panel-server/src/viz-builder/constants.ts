/*
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 *
 */

export const VIZ_TYPE_PARAM = {
  DASHBOARD_ITEM: 'dashboard-item',
  MAP_OVERLAY: 'map-overlay',
};

export type VizTypeKeys = keyof typeof VIZ_TYPE_PARAM;
export type VizType = typeof VIZ_TYPE_PARAM[VizTypeKeys];