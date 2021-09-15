/**
 * Tupaia Web
 * Copyright (c) 2019 Beyond Essential Systems Pty Ltd.
 * This source code is licensed under the AGPL-3.0 license
 * found in the LICENSE file in the root directory of this source tree.
 */

/**
 * MeasureBar
 *
 * Similar to LocationBar, provides measures in a grouped listing. Measures from redux state.
 * Updates redux state with action when a measure is selected. Map listens to this part of state
 * and renders appropriately.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import shallowEqual from 'shallowequal';

import { Control } from './Control';
import {
  setMapOverlay,
  clearMeasure,
  toggleMeasureExpand,
  updateMeasureConfig,
} from '../../actions';
import { HierarchyItem } from '../../components/HierarchyItem';
import {
  selectCurrentOrgUnit,
  selectCurrentMapOverlays,
  selectCurrentProject,
  selectMapOverlaysByIds,
} from '../../selectors';
import { getDefaultDates, getLimits } from '../../utils/periodGranularities';

export class MeasureBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasNeverBeenChanged: true,
    };
  }

  shouldComponentUpdate(nextProps) {
    const propsAreUnchanged = shallowEqual(this.props, nextProps);
    if (propsAreUnchanged) return false;
    return true;
  }

  handleSelectMeasure = measure => {
    if (this.state.hasNeverBeenChanged) {
      this.setState({
        hasNeverBeenChanged: false,
      });
    }

    this.props.onSelectMeasure(measure);
  };

  renderDefaultMeasure() {
    const { currentMapOverlays, defaultMapOverlay } = this.props;

    return (
      <HierarchyItem
        nestedMargin="0px"
        label={defaultMapOverlay.name}
        isSelected={currentMapOverlays
          .map(({ mapOverlayId }) => mapOverlayId)
          .include(defaultMapOverlay.mapOverlayId)}
        onClick={() => this.handleSelectMeasure(defaultMapOverlay)}
      />
    );
  }

  renderNestedHierarchyItems(children) {
    const { currentMapOverlays, onClearMeasure } = this.props;

    return children.map(childObject => {
      let nestedItems;

      if (childObject.children && childObject.children.length) {
        nestedItems = this.renderNestedHierarchyItems(childObject.children);
      }

      let onClick = null;

      if (!childObject.children) {
        onClick = currentMapOverlays
          .map(({ mapOverlayId }) => mapOverlayId)
          .include(childObject.mapOverlayId)
          ? () => onClearMeasure()
          : () => this.handleSelectMeasure(childObject);
      }

      return (
        <HierarchyItem
          label={childObject.name}
          info={childObject.info}
          isSelected={
            childObject.children
              ? null
              : currentMapOverlays
                  .map(({ mapOverlayId }) => mapOverlayId)
                  .include(childObject.mapOverlayId)
          }
          key={childObject.mapOverlayId}
          onClick={onClick}
          nestedItems={nestedItems}
        />
      );
    });
  }

  renderHierarchy() {
    const { measureHierarchy, defaultMapOverlay } = this.props;

    const items = measureHierarchy.map(({ name: groupName, children, info }) => {
      if (!Array.isArray(children)) return null;
      const nestedItems = this.renderNestedHierarchyItems(children);
      if (nestedItems.length === 0) return null;
      return (
        <HierarchyItem
          nestedMargin="0px"
          label={groupName}
          info={info}
          nestedItems={nestedItems}
          key={groupName}
        />
      );
    });

    return (
      <>
        {defaultMapOverlay ? this.renderDefaultMeasure() : null}
        {items}
      </>
    );
  }

  renderEmptyMessage() {
    const { currentOrganisationUnitName } = this.props;
    const orgName = currentOrganisationUnitName || 'Your current selection';

    return `Select an area with valid data. ${orgName} has no map overlays available.`;
  }

  render() {
    const {
      currentMapOverlays,
      isMeasureLoading,
      currentOrganisationUnitName,
      onUpdateMeasurePeriod,
    } = this.props;
    const orgName = currentOrganisationUnitName || 'Your current selection';
    const emptyMessage = `Select an area with valid data. ${orgName} has no map overlays available.`;

    const defaultDates = getDefaultDates(currentMapOverlays[0]);

    const datePickerLimits = getLimits(
      currentMapOverlays[0].periodGranularity,
      currentMapOverlays[0].datePickerLimits,
    );

    const { isTimePeriodEditable = true } = currentMapOverlays[0];

    const showDatePicker = isTimePeriodEditable && currentMapOverlays[0].periodGranularity;

    return (
      <Control
        emptyMessage={emptyMessage}
        selectedMeasure={currentMapOverlays[0]}
        showDatePicker={showDatePicker}
        defaultDates={defaultDates}
        datePickerLimits={datePickerLimits}
        isMeasureLoading={isMeasureLoading}
        onUpdateMeasurePeriod={onUpdateMeasurePeriod}
      >
        {this.renderHierarchy()}
      </Control>
    );
  }
}

const MapOverlayShape = PropTypes.shape({
  mapOverlayId: PropTypes.string,
  measureIds: PropTypes.array,
  name: PropTypes.string,
  periodGranularity: PropTypes.string,
  datePickerLimits: PropTypes.string,
  isTimePeriodEditable: PropTypes.string,
});

MeasureBar.propTypes = {
  currentMapOverlays: PropTypes.arrayOf(MapOverlayShape).isRequired,
  measureHierarchy: PropTypes.array.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  isMeasureLoading: PropTypes.bool.isRequired,
  onSelectMeasure: PropTypes.func.isRequired,
  onClearMeasure: PropTypes.func.isRequired,
  onUpdateMeasurePeriod: PropTypes.func.isRequired,
  currentOrganisationUnitCode: PropTypes.string,
  currentOrganisationUnitName: PropTypes.string,
  defaultMapOverlay: MapOverlayShape,
};

const mapStateToProps = state => {
  const { measureHierarchy, isExpanded } = state.measureBar;
  const { isMeasureLoading } = state.map;
  const { isLoadingOrganisationUnit } = state.global;

  const currentOrganisationUnit = selectCurrentOrgUnit(state);
  console.log(state);
  const currentMapOverlays = selectCurrentMapOverlays(state);
  const activeProject = selectCurrentProject(state);

  const defaultMapOverlay = selectMapOverlaysByIds(state, activeProject.defaultMeasure);

  return {
    currentMapOverlays,
    measureHierarchy,
    isExpanded,
    currentOrganisationUnitCode: currentOrganisationUnit.organisationUnitCode,
    currentOrganisationUnitName: currentOrganisationUnit.name,
    isMeasureLoading: isMeasureLoading || isLoadingOrganisationUnit,
    defaultMapOverlay,
  };
};

const mapDispatchToProps = dispatch => ({
  onExpandClick: () => dispatch(toggleMeasureExpand()),
  onClearMeasure: () => dispatch(clearMeasure()),
  onSelectMapOverlay: mapOverlay => dispatch(setMapOverlay(mapOverlay.mapOverlayId)),
  dispatch,
});

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { dispatch } = dispatchProps;
  const { currentMeasure } = stateProps;

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    onUpdateMeasurePeriod: (startDate, endDate) =>
      dispatch(updateMeasureConfig(currentMeasure.measureIds.join(','), { startDate, endDate })),
  };
};

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(MeasureBar);
