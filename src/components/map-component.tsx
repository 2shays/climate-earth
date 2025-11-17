'use client';

import 'ol/ol.css';
import React, { useRef, useEffect, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import type { TemperaturePoint } from '@/lib/data';
import { TEMP_RANGE } from '@/lib/data';
import { Style, Fill, Stroke } from 'ol/style';
import Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';

type MapComponentProps = {
  temperatureData: TemperaturePoint[];
};

// Helper function to get color from temperature
function getColorFromTemp(temp: number) {
  const normalizedTemp = (temp - TEMP_RANGE.min) / (TEMP_RANGE.max - TEMP_RANGE.min);
  
  if (normalizedTemp < 0.25) {
      // Blue to Cyan
      const r = 102;
      const g = 178 + (normalizedTemp / 0.25) * (255-178);
      const b = 255;
      return `rgb(${r}, ${g}, ${b})`;
  } else if (normalizedTemp < 0.5) {
      // Cyan to Green-Yellow
      const r = 127 + ((normalizedTemp - 0.25) / 0.25) * (255-127);
      const g = 255;
      const b = 212 - ((normalizedTemp - 0.25) / 0.25) * (212-0);
      return `rgb(${r}, ${g}, ${b})`;
  } else if (normalizedTemp < 0.75) {
      // Green-Yellow to Orange
      const r = 255;
      const g = 255 - ((normalizedTemp - 0.5) / 0.25) * (255-165);
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
  } else {
      // Orange to Red-Orange (Coral)
      const r = 255;
      const g = 165 - ((normalizedTemp - 0.75) / 0.25) * (165-127);
      const b = 0 + ((normalizedTemp - 0.75) / 0.25) * (80-0);
      return `rgb(${r}, ${g}, ${b})`;
  }
}

export default function MapComponent({ temperatureData }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const countriesLayer = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const regionsLayer = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const [countriesSource] = useState(new VectorSource());
  const [regionsSource] = useState(new VectorSource());

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    
    countriesLayer.current = new VectorLayer({
        source: countriesSource,
        style: new Style({
            fill: new Fill({
                color: 'rgba(255, 255, 255, 0.2)',
            }),
            stroke: new Stroke({
                color: '#3399CC',
                width: 1,
            }),
        }),
    });

    regionsLayer.current = new VectorLayer({
      source: regionsSource,
      style: new Style({
          fill: new Fill({
              color: 'rgba(255, 127, 80, 0.3)', // Coral with transparency
          }),
          stroke: new Stroke({
              color: '#FF4500', // OrangeRed
              width: 2,
          }),
      }),
    });

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        countriesLayer.current,
        regionsLayer.current,
      ],
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 2,
      }),
    });

    // Fetch country boundaries
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(response => response.json())
      .then(data => {
        const format = new GeoJSON({
            featureProjection: 'EPSG:3857' // Project to map's projection
        });
        const features = format.readFeatures(data);
        countriesSource.addFeatures(features);
      });
    
    // Fetch custom regions
    fetch('/data/IPCC-WGI-reference-regions-v4.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const format = new GeoJSON({
            featureProjection: 'EPSG:3857'
        });
        const features = format.readFeatures(data);
        regionsSource.addFeatures(features);
      })
      .catch(error => {
        console.error("Could not fetch or parse the GeoJSON file. Please ensure the file 'IPCC-WGI-reference-regions-v4.geojson' exists in the 'public/data/' directory.", error);
      });

    return () => {
      mapInstance.current?.setTarget(undefined);
      mapInstance.current = null;
    };
  }, [countriesSource, regionsSource]);

  // Update country colors based on temperature data
  useEffect(() => {
    const countryFeatures = countriesSource.getFeatures();
    if (countryFeatures.length === 0 || temperatureData.length === 0) {
      // Reset colors if no temp data
      countryFeatures.forEach(feature => {
        feature.setStyle(undefined);
      });
      return;
    }

    // Create a map to hold temperature data for each country
    const countryTemperatures: { [key: string]: number[] } = {};

    // Associate temperature points with countries
    temperatureData.forEach(point => {
        const lonLat = fromLonLat([point.lng, point.lat]);
        const countryFeature = countriesSource.getFeaturesAtCoordinate(lonLat)[0];
        if (countryFeature) {
            const countryCode = countryFeature.get('ISO_A3');
            if (!countryTemperatures[countryCode]) {
                countryTemperatures[countryCode] = [];
            }
            countryTemperatures[countryCode].push(point.temp);
        }
    });

    // Calculate average temperature and style each country
    countryFeatures.forEach(feature => {
      const countryCode = feature.get('ISO_A3');
      const temps = countryTemperatures[countryCode];

      let fillColor = 'rgba(255, 255, 255, 0.2)'; // Default color

      if (temps && temps.length > 0) {
        const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
        fillColor = getColorFromTemp(avgTemp);
      }
      
      const style = new Style({
        fill: new Fill({
          color: fillColor,
        }),
        stroke: new Stroke({
          color: '#3399CC',
          width: 1,
        }),
      });
      feature.setStyle(style);
    });

  }, [temperatureData, countriesSource]);

  return <div ref={mapRef} className="h-full w-full" />;
}
