/*
 * Tupaia
 *  Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { TilePicker as TilePickerComponent } from '@tupaia/ui-components/lib/map';
import { Map } from '../components/MapGL/Map';
import { Marker, Source, Layer, Popup } from 'react-map-gl';
import { YearSelector, MapOverlaysPanel } from '../components';
import { useMapOverlayReportData, useMapOverlaysData } from '../api';
import { TILE_SETS, DEFAULT_DATA_YEAR } from '../constants';
import { useUrlParams, useUrlSearchParam } from '../utils';

const Container = styled.div`
  position: relative;
  z-index: 1; // make sure the map is under the site menus & search
  display: flex;
  height: calc(100vh - 219px);
  min-height: 350px; // below which the map is basically unusable
`;

const Main = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
`;

const MapInner = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  z-index: 999;
  pointer-events: none;
`;

const LegendContainer = styled.div`
  display: flex;
  flex: 1;
  margin: 0 0.6rem 0.375rem;
`;

const TilePicker = styled(TilePickerComponent)`
  pointer-events: none;
`;

const getDefaultTileSet = () => {
  // default to osm in dev so that we don't pay for tiles when running locally
  if (process.env.NODE_ENV !== 'production') {
    return 'osm';
  }
  const SLOW_LOAD_TIME_THRESHOLD = 2 * 1000; // 2 seconds in milliseconds
  return window.loadTime < SLOW_LOAD_TIME_THRESHOLD ? 'satellite' : 'osm';
};

const dataLayer = {
  id: 'entity',
  type: 'fill',
  paint: {
    'fill-color': '#0080ff', // blue color fill
    'fill-opacity': 0.5,
  },
};

const getGeoJson = region => {
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: region,
    },
  };
};

// Important for perf: the markers never change, avoid rerender when the map viewport changes
const Markers = ({ data, onClick }) => {
  if (!data) {
    return null;
  }

  return data
    .filter(({ coordinates, region }) => region || (coordinates && coordinates.length === 2))
    .filter(({ isHidden }) => !isHidden)
    .map((measure, index) => {
      return (
        <Marker
          key={`marker-${index}`}
          longitude={measure.coordinates[1]}
          latitude={measure.coordinates[0]}
        >
          <svg
            height={20}
            width={20}
            viewBox="0 0 27 39"
            style={{
              cursor: 'pointer',
              fill: '#d00',
              stroke: 'none',
            }}
            onClick={() => onClick(measure)}
          >
            <path d="M13.5 0.631592C6.04607 0.631592 0 6.64584 0 14.0605C0 24.1322 13.5 39 13.5 39C13.5 39 27 24.1322 27 14.0605C27 6.64584 20.9539 0.631592 13.5 0.631592Z" />
            <circle cx="13.5" cy="14.1316" r="6" fill="white" fillOpacity="0.9" />
          </svg>
        </Marker>
      );
    });
};

export const MapGLView = () => {
  const { entityCode } = useUrlParams();
  const [selectedYear, setSelectedYear] = useUrlSearchParam('year', DEFAULT_DATA_YEAR);
  const [activeTileSetKey, setActiveTileSetKey] = useState(getDefaultTileSet());
  const [popupInfo, setPopupInfo] = useState(null);
  const { data: overlaysData, isLoading: isLoadingOverlays } = useMapOverlaysData({ entityCode });

  const {
    isLoading,
    data: overlayReportData,
    entityData,
    hiddenValues,
    setValueHidden,
    selectedOverlay,
    setSelectedOverlay,
  } = useMapOverlayReportData({ entityCode, year: selectedYear });

  const activeTileSet = TILE_SETS.find(tileSet => tileSet.key === activeTileSetKey);

  const region = entityData?.region[0];

  const geoJson = getGeoJson(region);

  return (
    <Container>
      <MapOverlaysPanel
        isLoadingOverlays={isLoadingOverlays}
        isLoadingData={isLoading}
        overlays={overlaysData}
        selectedOverlay={selectedOverlay}
        setSelectedOverlay={setSelectedOverlay}
        YearSelector={<YearSelector value={selectedYear} onChange={setSelectedYear} />}
      />
      <Main>
        <Map bounds={entityData ? entityData.bounds : null} mapStyle={activeTileSet.url}>
          <Source type="geojson" data={geoJson}>
            <Layer {...dataLayer} />
          </Source>
          <Markers data={overlayReportData?.measureData} onClick={setPopupInfo} />
          {popupInfo && (
            <Popup
              tipSize={5}
              anchor="top"
              longitude={popupInfo.coordinates[1]}
              latitude={popupInfo.coordinates[0]}
              closeOnClick={false}
              onClose={setPopupInfo}
            >
              <h3>{popupInfo.name}</h3>
            </Popup>
          )}
        </Map>
        <MapInner>
          <LegendContainer>Legend</LegendContainer>
          <TilePicker
            tileSets={TILE_SETS}
            activeTileSet={activeTileSet}
            onChange={setActiveTileSetKey}
          />
        </MapInner>
      </Main>
    </Container>
  );
};
