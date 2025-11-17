'use client';

import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import type { TemperaturePoint } from '@/lib/data';
import { TEMP_RANGE } from '@/lib/data';

// URL to the TopoJSON file for world map
const geoUrl =
  'https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json';

// Function to get color based on temperature
const getColorForTemperature = (temp: number) => {
  const normalizedTemp =
    (temp - TEMP_RANGE.min) / (TEMP_RANGE.max - TEMP_RANGE.min);

  // Gradient: blue -> cyan -> yellow -> orange -> red
  if (normalizedTemp < 0.25) {
    const t = normalizedTemp / 0.25;
    const blue = 255 * (1 - t);
    const green = 255 * t;
    return `rgb(0, ${Math.round(green)}, ${Math.round(blue)})`; // Blue to Cyan
  } else if (normalizedTemp < 0.5) {
    const t = (normalizedTemp - 0.25) / 0.25;
    return `rgb(${Math.round(255 * t)}, 255, ${Math.round(212 * (1-t))})`; // Cyan to Yellow
  } else if (normalizedTemp < 0.75) {
    const t = (normalizedTemp - 0.5) / 0.25;
    return `rgb(255, ${Math.round(255 - 90 * t)}, 0)`; // Yellow to Orange
  } else {
    const t = (normalizedTemp - 0.75) / 0.25;
    return `rgb(255, ${Math.round(165 - 165 * t)}, 0)`; // Orange to Red
  }
};

type MapComponentProps = {
  temperatureData: TemperaturePoint[];
};

export default function MapComponent({ temperatureData }: MapComponentProps) {
  return (
    <div className="h-full w-full bg-background" data-testid="map-component">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{
          scale: 180,
          center: [0, 20],
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Geographies
          geography={geoUrl}
          fill="#344150"
          stroke="#17263c"
          strokeWidth={0.5}
        >
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography key={geo.rsmKey} geography={geo} />
            ))
          }
        </Geographies>
        {temperatureData.map((point, index) => (
          <Marker
            key={index}
            coordinates={[point.lng, point.lat]}
          >
            <circle
              r={2}
              fill={getColorForTemperature(point.temp)}
              stroke="#fff"
              strokeWidth={0.2}
              style={{ opacity: 0.7 }}
            />
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}
