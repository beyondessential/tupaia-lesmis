/*
 * Tupaia
 *  Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import * as React from 'react';
import { useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import ReactMapGL, { WebMercatorViewport, FlyToInterpolator } from 'react-map-gl';

export const Map = ({ bounds, ...props }) => {
  const [viewport, setViewport] = useState({
    width: 500,
    height: 500,
    latitude: 14.7,
    longitude: 107.5,
    zoom: 8,
  });

  const flyToBounds = bounds => {
    const { longitude, latitude, zoom } = new WebMercatorViewport(viewport).fitBounds(bounds, {
      padding: 20,
      offset: [0, -100],
    });

    setViewport({
      ...viewport,
      longitude,
      latitude,
      zoom,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
    });
  };

  React.useEffect(() => {
    console.log('bounds', bounds);
    if (bounds) {
      flyToBounds(bounds);
    }
  }, [bounds]);

  React.useEffect(() => {
    setViewport({
      ...viewport,
      height: '100%',
      width: '100%',
    });
  }, []);

  return (
    <ReactMapGL
      {...viewport}
      onViewportChange={nextViewport => setViewport(nextViewport)}
      {...props}
    />
  );
};
