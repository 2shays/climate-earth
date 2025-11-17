'use client';

import 'ol/ol.css';
import React, { useRef, useEffect } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { TEMP_RANGE } from '@/lib/data';
import { Style, Fill, Stroke } from 'ol/style';
import Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import type { RegionYearlyTemperatureData } from '@/lib/region-data';
import { Overlay } from 'ol';
import type { MapBrowserEvent } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

type MapComponentProps = {
  regionTemperatureData: RegionYearlyTemperatureData | undefined;
};

// Helper function to get color from temperature
function getColorFromTemp(temp: number) {
  const alpha = 0.25; // Lower opacity as requested
  const normalizedTemp = (temp - TEMP_RANGE.min) / (TEMP_RANGE.max - TEMP_RANGE.min);

  if (normalizedTemp < 0.25) {
    const r = 102;
    const g = 178 + (normalizedTemp / 0.25) * (255 - 178);
    const b = 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else if (normalizedTemp < 0.5) {
    const r = 102 + ((normalizedTemp - 0.25) / 0.25) * (255 - 102);
    const g = 255;
    const b = 255 - ((normalizedTemp - 0.25) / 0.25) * 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else if (normalizedTemp < 0.75) {
    const r = 255;
    const g = 255 - ((normalizedTemp - 0.5) / 0.25) * (255 - 165);
    const b = 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } else {
    const r = 255;
    const g = 165 - ((normalizedTemp - 0.75) / 0.25) * 165;
    const b = 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

const defaultRegionStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.0)', // Transparent fill
  }),
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 0.4)',
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
  const allFeaturesRef = useRef<Feature<Geometry>[]>([]);
  const regionTempDataRef = useRef<RegionYearlyTemperatureData>();

  // Keep a ref to the latest temp data to use in the style function
  useEffect(() => {
    regionTempDataRef.current = regionTemperatureData;
  }, [regionTemperatureData]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !tooltipRef.current || mapInstance.current) return;

    const mapBackgroundLayer = new TileLayer({
        source: new OSM(),
        opacity: 0.3,
    });
      
    const regionsSource = new VectorSource();

    regionsLayer.current = new VectorLayer({
      source: regionsSource,
      style: (feature) => {
        const acronym = feature.get('Acronym');
        const currentTempData = regionTempDataRef.current;
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
        mapBackgroundLayer,
        regionsLayer.current,
        highlightLayer.current
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
      overlays: [tooltipOverlay],
    });

    let selectedFeature: FeatureLike | null = null;

    mapInstance.current.on('pointermove', (evt: MapBrowserEvent<UIEvent>) => {
      if (evt.dragging || !tooltipRef.current || !mapInstance.current) {
        tooltipOverlay.setPosition(undefined);
        return;
      }
      const pixel = mapInstance.current.getEventPixel(evt.originalEvent);
      
      const feature = mapInstance.current.forEachFeatureAtPixel(pixel, f => f, {
          layerFilter: l => l === regionsLayer.current,
      });
      
      const highlightSource = highlightLayer.current?.getSource();
      if (!highlightSource) return;

      if (selectedFeature && selectedFeature !== feature) {
         highlightSource.removeFeature(selectedFeature as Feature<Geometry>);
         selectedFeature = null;
      }
      
      if (feature && feature !== selectedFeature) {
          highlightSource.addFeature(feature as Feature<Geometry>);
          selectedFeature = feature;
      }
      
      const currentTempData = regionTempDataRef.current;
      if (feature && currentTempData) {
          const regionAcronym = feature.get('Acronym');
          const regionName = feature.get('Name');
          const temp = currentTempData.regionTemps[regionAcronym];
          
          if (temp !== undefined) {
              tooltipRef.current.innerHTML = `<b>${regionName} (${regionAcronym})</b><br>${temp.toFixed(2)}°C`;
              tooltipOverlay.setPosition(evt.coordinate);
          } else {
             tooltipOverlay.setPosition(undefined);
          }
      } else {
          tooltipOverlay.setPosition(undefined);
      }
    });
    
    fetch('/data/IPCC-WGI-reference-regions-v4.geojson')
      .then(response => {
        if (!response.ok) {
          throw new Error("Could not fetch or parse the GeoJSON file. Please ensure the file 'IPCC-WGI-reference-regions-v4.geojson' exists in the 'public/data/' directory.");
        }
        return response.json();
      })
      .then(data => {
        const format = new GeoJSON({
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });
        const features = format.readFeatures(data);

        // Sort features to draw complex ones on top to solve hover issue
        features.sort((a, b) => {
            const geomA = a.getGeometry()?.getType();
            const geomB = b.getGeometry()?.getType();
            if (geomA === 'Polygon' && geomB === 'MultiPolygon') return 1;
            if (geomA === 'MultiPolygon' && geomB === 'Polygon') return -1;
            return 0;
        });

        allFeaturesRef.current = features;
        // Initial load with data if available
        if (regionTempDataRef.current) {
            const source = regionsLayer.current?.getSource();
            if(source) {
                const featuresWithData = allFeaturesRef.current.filter(feature => {
                    const acronym = feature.get('Acronym');
                    return regionTempDataRef.current!.regionTemps[acronym] !== undefined;
                });
                source.addFeatures(featuresWithData);
            }
        }
      })
      .catch(error => {
        console.error(error);
      });

    return () => {
      mapInstance.current?.setTarget(undefined);
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const source = regionsLayer.current?.getSource();
    if (source && regionTemperatureData && allFeaturesRef.current.length > 0) {
        source.clear();
        const featuresWithData = allFeaturesRef.current.filter(feature => {
            const acronym = feature.get('Acronym');
            return regionTemperatureData.regionTemps[acronym] !== undefined;
        });
        source.addFeatures(featuresWithData);
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
