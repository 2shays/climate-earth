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
  const alpha = 0.5; // Reduced Opacity
  
  if (normalizedTemp < 0.25) {
      // Blue to Cyan
      const r = 102;
      const g = 178 + (normalizedTemp / 0.25) * (255-178);
      const b = 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else if (normalizedTemp < 0.5) {
      // Cyan to Green-Yellow
      const r = 127 + ((normalizedTemp - 0.25) / 0.25) * (255-127);
      const g = 255;
      const b = 212 - ((normalizedTemp - 0.25) / 0.25) * (212-0);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else if (normalizedTemp < 0.75) {
      // Green-Yellow to Orange
      const r = 255;
      const g = 255 - ((normalizedTemp - 0.5) / 0.25) * (255-165);
      const b = 0;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else {
      // Orange to Red-Orange (Coral)
      const r = 255;
      const g = 165 - ((normalizedTemp - 0.75) / 0.25) * (165-127);
      const b = 0 + ((normalizedTemp - 0.75) / 0.25) * (80-0);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

const defaultRegionStyle = new Style({
  fill: new Fill({
    color: 'rgba(128, 128, 128, 0.2)', // Neutral grey fill
  }),
  stroke: new Stroke({
    color: '#888888', // Lighter grey stroke
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
  const [regionsSource] = useState(new VectorSource());
  const selectedFeature = useRef<FeatureLike | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !tooltipRef.current || mapInstance.current) return;

    regionsLayer.current = new VectorLayer({
      source: regionsSource,
      style: (feature) => {
        const acronym = feature.get('Acronym');
        if (regionTemperatureData && regionTemperatureData.regionTemps[acronym] !== undefined) {
          const temp = regionTemperatureData.regionTemps[acronym];
          const color = getColorFromTemp(temp);
          return new Style({
            fill: new Fill({ color }),
            stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.4)', width: 1 }),
          });
        }
        return defaultRegionStyle;
      },
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
      ],
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 2,
      }),
      overlays: [tooltipOverlay],
    });

    const highlightLayer = new VectorLayer({
        source: new VectorSource(),
        style: highlightStyle,
    });
    mapInstance.current.addLayer(highlightLayer);

    mapInstance.current.on('pointermove', (evt: MapBrowserEvent<UIEvent>) => {
      if (evt.dragging || !tooltipRef.current) {
        tooltipOverlay.setPosition(undefined);
        return;
      }
      const pixel = mapInstance.current!.getEventPixel(evt.originalEvent);
      
      const feature = mapInstance.current!.forEachFeatureAtPixel(pixel, f => f, {
          layerFilter: l => l === regionsLayer.current,
      });
      
      const highlightSource = highlightLayer.getSource();
      if (!highlightSource) return;

      if (selectedFeature.current) {
        highlightSource.removeFeature(selectedFeature.current as Feature<Geometry>);
      }
      
      if (feature) {
          selectedFeature.current = feature;
          highlightSource.addFeature(feature as Feature<Geometry>);
          
          const regionAcronym = feature.get('Acronym');
          const regionName = feature.get('Name');
          const temp = regionTemperatureData?.regionTemps[regionAcronym];
          
          if (temp !== undefined) {
              tooltipRef.current!.innerHTML = `<b>${regionName} (${regionAcronym})</b><br>${temp.toFixed(2)}°C`;
              tooltipOverlay.setPosition(evt.coordinate);
          } else {
             tooltipOverlay.setPosition(undefined);
          }
      } else {
          selectedFeature.current = null;
          tooltipOverlay.setPosition(undefined);
      }
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
  }, [regionsSource, regionTemperatureData]); // Add dependencies

  // Update region colors based on temperature data
  useEffect(() => {
    if (regionsLayer.current) {
        // This is the key change: it tells the layer to re-evaluate its styles.
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
