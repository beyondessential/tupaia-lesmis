/**
 * Tupaia Web
 * Copyright (c) 2017- 2021 Beyond Essential Systems Pty Ltd.
 * This source code is licensed under the AGPL-3.0 license
 * found in the LICENSE file in the root directory of this source tree.
 */

import { createSelector } from 'reselect';
import { selectCurrentProject } from './projectSelectors';
import { getLocationComponentValue, URL_COMPONENTS } from '../historyNavigation';
import {
  flattenMapOverlayHierarchy,
  getMapOverlaysFromHierarchy,
  isMeasureHierarchyEmpty,
} from '../utils';

import { selectLocation } from './utils';
import { DEFAULT_MEASURE_ID } from '../defaults';

export const selectDefaultMapOverlayIds = createSelector(
  [state => state.measureBar.measureHierarchy, selectCurrentProject],
  (measureHierarchy, project) => {
    const projectMeasureId = project.defaultMeasure;
    const measureIsDefined = id => !!getMapOverlaysFromHierarchy(measureHierarchy, id);

    if (measureIsDefined(projectMeasureId)) return projectMeasureId;
    if (measureIsDefined(DEFAULT_MEASURE_ID)) return DEFAULT_MEASURE_ID;
    if (!isMeasureHierarchyEmpty(measureHierarchy)) {
      return flattenMapOverlayHierarchy(measureHierarchy)[0].mapOverlayId;
    }

    return DEFAULT_MEASURE_ID;
  },
);

export const selectMapOverlaysByIds = createSelector(
  [state => state.measureBar.measureHierarchy, (_, ids) => ids],
  (measureHierarchy, ids) => {
    return getMapOverlaysFromHierarchy(measureHierarchy, ids);
  },
);

export const selectCurrentMapOverlayIds = createSelector([selectLocation], location =>
  getLocationComponentValue(location, URL_COMPONENTS.MAP_OVERLAY_IDS),
);

export const selectMeasureIdsByOverlayIds = createSelector(
  [state => state, (_, id) => id],
  (state, id) => {
    console.log(state);
    return id;
  },
);
