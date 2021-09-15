/**
 * Tupaia Web
 * Copyright (c) 2020 Beyond Essential Systems Pty Ltd.
 * This source code is licensed under the AGPL-3.0 license
 * found in the LICENSE file in the root directory of this source tree.
 */

import createCachedSelector from 're-reselect';
import { createSelector } from 'reselect';
import { DEFAULT_MEASURE_ID } from '../defaults';
import { getLocationComponentValue, URL_COMPONENTS } from '../historyNavigation';
import { getMapOverlaysFromHierarchy } from '../utils';
import {
  calculateRadiusScaleFactor,
  flattenMapOverlayHierarchy,
  getMeasureDisplayInfo,
  isMeasureHierarchyEmpty,
  POLYGON_MEASURE_TYPES,
} from '../utils/measures';
import {
  selectActiveProjectCountries,
  selectAllOrgUnitsInCountry,
  selectAncestors,
  selectCountriesAsOrgUnits,
  selectCountryHierarchy,
  selectCurrentOrgUnitCode,
  selectDescendantsFromCache,
} from './orgUnitSelectors';
import { selectCurrentProject, selectCurrentProjectCode } from './projectSelectors';
import { getOrgUnitFromCountry, safeGet, selectLocation } from './utils';

const displayInfoCache = createCachedSelector(
  [
    measureOptions => measureOptions,
    (_, hiddenMeasures) => hiddenMeasures,
    (_, __, data) => data,
    (_, __, ___, organisationUnitCode) => organisationUnitCode,
  ],
  (options = [], hiddenMeasures, data, organisationUnitCode) => {
    return {
      organisationUnitCode,
      ...data,
      ...getMeasureDisplayInfo({ ...data }, options, hiddenMeasures),
    };
  },
)((_, __, ___, organisationUnitCode) => organisationUnitCode);

const getOrgUnitFromMeasureData = (measureData, code) =>
  measureData.find(val => val.organisationUnitCode === code);

const selectDisplayInfo = (measureOptions, hiddenMeasures, measureData, organisationUnitCode) =>
  safeGet(displayInfoCache, [measureOptions, hiddenMeasures, measureData, organisationUnitCode]);

export const selectCurrentMapOverlayIds = createSelector(
  [selectLocation],
  location => getLocationComponentValue(location, URL_COMPONENTS.MAP_OVERLAY_IDS) || [''],
);

export const selectCurrentMapOverlays = createSelector(
  [state => selectMapOverlaysByIds(state, selectCurrentMapOverlayIds(state))],
  currentMapOverlays => currentMapOverlays || [{}],
);

const selectDisplayLevelAncestor = createSelector(
  [
    state => selectCountryHierarchy(state, selectCurrentOrgUnitCode(state)),
    selectCurrentOrgUnitCode,
    state => state.map.measureInfo.measureOptions,
  ],
  (country, currentOrganisationUnitCode, measureOptions) => {
    if (!country || !currentOrganisationUnitCode || !measureOptions) {
      return undefined;
    }

    const displayOnLevel = measureOptions.map(option => option.displayOnLevel).find(level => level);
    if (!displayOnLevel) {
      return undefined;
    }

    return selectAncestors(country, currentOrganisationUnitCode, displayOnLevel).find(
      ancestor => ancestor.type === displayOnLevel,
    );
  },
);

export const selectHasPolygonMeasure = createSelector(
  [state => state.map.measureInfo],
  (measureInfo = {}) => {
    return (
      measureInfo.measureOptions &&
      measureInfo.measureOptions.some(option => POLYGON_MEASURE_TYPES.includes(option.type))
    );
  },
);

export const selectAllMeasuresWithDisplayInfo = createSelector(
  [
    state => selectActiveProjectCountries(state),
    state => selectCurrentProjectCode(state),
    state => selectCountryHierarchy(state, state.map.measureInfo.currentCountry),
    state => state.map.measureInfo.measureData,
    state => state.map.measureInfo.measureOptions,
    state => state.map.measureInfo.hiddenMeasures,
    state => state.map.measureInfo.currentCountry,
    state => state.map.measureInfo.measureLevel,
  ],
  (
    projectCountries,
    projectCode,
    country,
    measureData,
    measureOptions,
    hiddenMeasures,
    currentCountry,
    measureLevel,
  ) => {
    if (!currentCountry || !measureData || !country) {
      return [];
    }

    const listOfMeasureLevels = measureLevel.split(',');
    let allOrgUnitsOfLevel = selectAllOrgUnitsInCountry(country).filter(orgUnit => {
      return listOfMeasureLevels.includes(orgUnit.type);
    });
    if (currentCountry === projectCode) allOrgUnitsOfLevel = projectCountries;
    return allOrgUnitsOfLevel.map(orgUnit =>
      selectDisplayInfo(
        measureOptions,
        hiddenMeasures,
        getOrgUnitFromMeasureData(measureData, orgUnit.organisationUnitCode),
        orgUnit.organisationUnitCode,
      ),
    );
  },
);

export const selectAllMeasuresWithDisplayAndOrgUnitData = createSelector(
  [
    state => selectCountryHierarchy(state, state.map.measureInfo.currentCountry),
    selectAllMeasuresWithDisplayInfo,
    state => selectCountriesAsOrgUnits(state),
  ],
  (country, allMeasureData, countries) => {
    const type = country && country[country.countryCode]?.type;

    if (type === 'Project') {
      return allMeasureData.map(data => {
        const countryData = countries.find(
          c => c.organisationUnitCode === data.organisationUnitCode,
        );
        return {
          ...data,
          ...countryData,
        };
      });
    }

    return allMeasureData.map(data => ({
      ...data,
      ...getOrgUnitFromCountry(country, data.organisationUnitCode),
    }));
  },
);

export const selectRenderedMeasuresWithDisplayInfo = createSelector(
  [
    state => selectCountryHierarchy(state, selectCurrentOrgUnitCode(state)),
    selectAllMeasuresWithDisplayAndOrgUnitData,
    selectDisplayLevelAncestor,
    state => state.map.measureInfo.measureOptions,
    state => selectCountriesAsOrgUnits(state),
  ],
  (country, allMeasuresWithMeasureInfo, displaylevelAncestor, measureOptions = []) => {
    const displayOnLevel = measureOptions.map(option => option.displayOnLevel).find(level => level);

    if (!displayOnLevel) {
      return allMeasuresWithMeasureInfo;
    }

    if (!displaylevelAncestor) {
      return [];
    }

    const allDescendantCodesOfAncestor = selectDescendantsFromCache(
      country,
      displaylevelAncestor.organisationUnitCode,
    ).map(descendant => descendant.organisationUnitCode);

    return allMeasuresWithMeasureInfo.filter(measure =>
      allDescendantCodesOfAncestor.includes(measure.organisationUnitCode),
    );
  },
);

export const selectRadiusScaleFactor = createSelector(
  [selectAllMeasuresWithDisplayInfo],
  calculateRadiusScaleFactor,
);

export const selectMapOverlaysByIds = createSelector(
  [state => state.measureBar.measureHierarchy, (_, ids) => ids],
  (measureHierarchy, ids) => {
    return getMapOverlaysFromHierarchy(measureHierarchy, ids);
  },
);

export const selectMeasureBarItemCategoryById = createSelector(
  [state => state.measureBar.measureHierarchy, (_, id) => id],
  (measureHierarchy, id) => {
    let categoryMeasureIndex = {};

    measureHierarchy.forEach(({ name, children }, categoryIndex) => {
      const selectedMeasureIndex = children.findIndex(
        measure => measure.measureIds.toString() === id.toString(),
      );
      if (selectedMeasureIndex > -1) {
        categoryMeasureIndex = {
          name,
          categoryIndex,
          measureIndex: selectedMeasureIndex,
          measure: children[selectedMeasureIndex],
        };
      }
    });

    return categoryMeasureIndex;
  },
);

export const selectIsMeasureInHierarchy = createSelector(
  [state => state.measureBar.measureHierarchy, (_, ids) => ids],
  (measureHierarchy, ids) => !!getMapOverlaysFromHierarchy(measureHierarchy, ids),
);

export const selectDefaultMapOverlayIds = createSelector(
  [state => state.measureBar.measureHierarchy, selectCurrentProject],
  (measureHierarchy, project) => {
    console.log('measureHierarchy');
    console.log(measureHierarchy);
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

export const selectCurrentPeriodGranularity = createSelector(
  [selectCurrentMapOverlays],
  mapOverlays => mapOverlays[0].periodGranularity || null,
);

export const selectMeasureIdsByOverlayIds = createSelector(
  [state => state, (_, id) => id],
  (state, id) => {
    console.log(state);
    return id;
  },
);
