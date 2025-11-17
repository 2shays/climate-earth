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
import { TEMP_RANGE } from '@/lib/data';
import { Style, Fill, Stroke } from 'ol/style';
import Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import type { RegionYearlyTemperatureData } from '@/lib/region-data';
import { Overlay } from 'ol';
import type { MapBrowserEvent } from 'ol';
import type { FeatureLike } from 'ol/Feature';

type MapComponentProps = {
  regionTemperatureData: RegionYearlyTemperatureData | undefined;
};

// Helper function to get color from temperature
function getColorFromTemp(temp: number) {
  const normalizedTemp = (temp - TEMP_RANGE.min) / (TEMP_RANGE.max - TEMP_RANGE.min);
  const alpha = 0.25; // Reduced Opacity

  // Blue (#66B2FF) -> Cyan (#7FFFD4)
  if (normalizedTemp < 0.25) {
    const r = 102 + (normalizedTemp / 0.25) * (127 - 102);
    const g = 178 + (normalizedTemp / 0.25) * (255 - 178);
    const b = 255 - (normalizedTemp / 0.25) * (255 - 212);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } 
  // Cyan (#7FFFD4) -> Yellow (#FFFF00)
  else if (normalizedTemp < 0.5) {
    const r = 127 + ((normalizedTemp - 0.25) / 0.25) * (255 - 127);
    const g = 255;
    const b = 212 - ((normalizedTemp - 0.25) / 0.25) * 212;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } 
  // Yellow (#FFFF00) -> Orange (#FFA500)
  else if (normalizedTemp < 0.75) {
    const r = 255;
    const g = 255 - ((normalizedTemp - 0.5) / 0.25) * (255 - 165);
    const b = 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } 
  // Orange (#FFA500) -> Coral (#FF7F50)
  else {
    const r = 255;
    const g = 165 - ((normalizedTemp - 0.75) / 0.25) * (165 - 127);
    const b = 0 + ((normalizedTemp - 0.75) / 0.25) * (80 - 0);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

const defaultRegionStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.0)', // Transparent fill
  }),
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 0.4)', // Lighter grey stroke for all regions
    width: 1,
  }),
});

const highlightStyle = new Style({
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 0.9)',
    width: 2,
  }),
  fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)'
  })
});

export default function MapComponent({ regionTemperatureData }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const regionsLayer = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const highlightLayer = useRef<VectorLayer<VectorSource<Feature<Geometry>>> | null>(null);
  const temperatureDataRef = useRef(regionTemperatureData);

  // Keep a ref to the latest temperature data to avoid stale closures in the style function
  useEffect(() => {
    temperatureDataRef.current = regionTemperatureData;
  }, [regionTemperatureData]);


  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !tooltipRef.current || mapInstance.current) return;

    const regionsSource = new VectorSource();

    regionsLayer.current = new VectorLayer({
      source: regionsSource,
      style: (feature) => {
        const acronym = feature.get('Acronym');
        const currentTempData = temperatureDataRef.current;
        if (currentTempData && currentTempData.regionTemps[acronym] !== undefined) {
          const temp = currentTempData.regionTemps[acronym];
          const color = getColorFromTemp(temp);
          return new Style({
            fill: new Fill({ color }),
            stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.4)', width: 1 }),
          });
        }
        return defaultRegionStyle;
      },
    });

    highlightLayer.current = new VectorLayer({
        source: new VectorSource(),
        style: highlightStyle,
    });

    const tooltipOverlay = new Overlay({
      element: tooltipRef.current,
      offset: [15, 0],
      positioning: 'center-left',
    });

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        regionsLayer.current,
        highlightLayer.current
      ],
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 2,
      }),
      overlays: [tooltipOverlay],
    });

    let selectedFeature: FeatureLike | null = null;

    mapInstance.current.on('pointermove', (evt: MapBrowserEvent<UIEvent>) => {
      if (evt.dragging || !tooltipRef.current) {
        tooltipOverlay.setPosition(undefined);
        return;
      }
      const pixel = mapInstance.current!.getEventPixel(evt.originalEvent);
      
      const feature = mapInstance.current!.forEachFeatureAtPixel(pixel, f => f, {
          layerFilter: l => l === regionsLayer.current,
      });
      
      const highlightSource = highlightLayer.current!.getSource();
      if (!highlightSource) return;

      // Clear previous highlight
      if (selectedFeature && selectedFeature !== feature) {
         highlightSource.removeFeature(selectedFeature as Feature<Geometry>);
      }
      
      if (feature && feature !== selectedFeature) {
          selectedFeature = feature;
          highlightSource.addFeature(feature as Feature<Geometry>);
      }

      if (feature) {
          const regionAcronym = feature.get('Acronym');
          const regionName = feature.get('Name');
          const temp = temperatureDataRef.current?.regionTemps[regionAcronym];
          
          if (temp !== undefined) {
              tooltipRef.current!.innerHTML = `<b>${regionName} (${regionAcronym})</b><br>${temp.toFixed(2)}°C`;
              tooltipOverlay.setPosition(evt.coordinate);
          } else {
             tooltipOverlay.setPosition(undefined);
          }
      } else {
          selectedFeature = null;
          tooltipOverlay.setPosition(undefined);
      }
    });
    
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
  }, []);

  // Update region colors based on temperature data
  useEffect(() => {
    if (regionsLayer.current) {
        regionsLayer.current.getSource()?.changed();
    }
  }, [regionTemperatureData]);

  return (
    <>
      <div ref={mapRef} className="h-full w-full" />
      <div 
        ref={tooltipRef} 
        className="tooltip-container bg-card/80 backdrop-blur-sm text-card-foreground p-2 rounded-md shadow-lg text-sm whitespace-nowrap"
        style={{ position: 'absolute', display: 'block', pointerEvents: 'none' }}
      ></div>
    </>
  );
}
