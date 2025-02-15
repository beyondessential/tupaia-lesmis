/**
 * Tupaia Web
 * Copyright (c) 2019 Beyond Essential Systems Pty Ltd.
 * This source code is licensed under the AGPL-3.0 license
 * found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Index file that exports all utility functions that we use throughout tupaia_web
 */
export { default as request } from './request';
export { default as checkBoundsDifference } from './checkBoundsDifference';
export { organisationUnitIsArea } from './organisation';
export { isMobile, delayMobileTapCallback } from './mobile';
export { getCenterAndZoomForBounds } from './getCenterAndZoomForBounds';
export { getOrgUnitPhotoUrl } from './getOrgUnitPhotoUrl';
export { getMapUrl } from './getMapUrl';
export { processMeasureInfo, flattenNumericalMeasureData } from './measures';
export {
  getMapOverlaysFromHierarchy,
  checkHierarchyIncludesMapOverlayCodes,
  flattenMapOverlayHierarchy,
  isMapOverlayHierarchyEmpty,
} from './mapOverlays';
export { default as ga, gaEvent, gaPageView, gaMiddleware } from './ga';
export { formatDateForApi } from './formatDateForApi';
export { getBrowserTimeZone } from './getBrowserTimeZone';
export { formatDataValue } from './formatters';
export { findByKey } from './collection';
export { areStringsEqual } from './string';
export { hexToRgba, getPresentationOption, getInactiveColor } from './color';
export {
  getUniqueViewId,
  getViewIdFromInfoViewKey,
  getInfoFromInfoViewKey,
} from './getUniqueViewId';
export { sleep } from './sleep';
export { getLayeredOpacity } from './opacity';
