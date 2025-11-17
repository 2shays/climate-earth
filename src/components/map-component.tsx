
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
import { getArea } from 'ol/sphere';
import type { RegionYearlyTemperatureData } from '@/lib/region-data';
import { Overlay } from 'ol';
import type { MapBrowserEvent } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';

type MapComponentProps = {
  regionTemperatureData: RegionYearlyTemperatureData | undefined;
};

// Helper function to get color from temperature
function getColorFromTemp(temp: number) {
  const alpha = 0.25;
  const normalizedTemp = Math.max(0, Math.min(1, (temp - TEMP_RANGE.min) / (TEMP_RANGE.max - TEMP_RANGE.min)));

  let r, g, b;

  if (normalizedTemp < 0.25) { // Blue to Cyan
      r = 102;
      g = 178 + (normalizedTemp / 0.25) * (255 - 178);
      b = 255;
  } else if (normalizedTemp < 0.5) { // Cyan to Green/Yellow
      r = 102 + ((normalizedTemp - 0.25) / 0.25) * (255 - 102);
      g = 255;
      b = 255 - ((normalizedTemp - 0.25) / 0.25) * 255;
  } else if (normalizedTemp < 0.75) { // Yellow to Orange
      r = 255;
      g = 255 - ((normalizedTemp - 0.5) / 0.25) * (255 - 165);
      b = 0;
  } else { // Orange to Red
      r = 255;
      g = 165 - ((normalizedTemp - 0.75) / 0.25) * 165;
      b = 0;
  }

  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
}


const defaultRegionStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.0)', // Transparent fill
  }),
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 0.0)', // Transparent stroke
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
  }),
  zIndex: Infinity // Ensure highlight is always on top
});

const sortFeatures = (a: Feature<Geometry>, b: Feature<Geometry>) => {
    const geomA = a.getGeometry();
    const geomB = b.getGeometry();
    if (geomA && geomB) {
        // Draw smaller features on top of larger ones
        return getArea(geomB) - getArea(geomA);
    }
    return 0;
};


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
    const source = regionsLayer.current?.getSource();
    if (source) {
        source.clear();
        if (regionTemperatureData && allFeaturesRef.current.length > 0) {
            const featuresWithData = allFeaturesRef.current.filter(feature => {
                const acronym = feature.get('Acronym');
                return regionTemperatureData.regionTemps[acronym] !== undefined;
            });
            featuresWithData.sort(sortFeatures);
            source.addFeatures(featuresWithData);
        }
    }
  }, [regionTemperatureData]);


  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !tooltipRef.current || mapInstance.current) return;

    const mapBackgroundLayer = new TileLayer({
        source: new OSM(),
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
          const geom = feature.getGeometry();
          let zIndex = 0;
          if (geom) {
            // Smaller area = higher z-index, but inverted because we want smaller on top
             zIndex = Math.floor(1000 - Math.log(getArea(geom) || 1));
          }
          return new Style({
            fill: new Fill({ color }),
            stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.4)', width: 1 }),
            zIndex,
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

    const mapExtent = fromLonLat([-180, -85.06]).concat(fromLonLat([180, 85.06]));

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
        extent: mapExtent,
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
    
      // Hit detection
      const featuresAtPixel: FeatureLike[] = [];
      mapInstance.current.forEachFeatureAtPixel(pixel, (feature) => {
        featuresAtPixel.push(feature);
      }, {
        layerFilter: (l) => l === regionsLayer.current,
      });
    
      let topFeature: FeatureLike | undefined = undefined;
      if (featuresAtPixel.length > 0) {
        // Find the feature with the smallest area to prioritize it for hover
        topFeature = featuresAtPixel.reduce((smallest, current) => {
            const smallestGeom = smallest.getGeometry();
            const currentGeom = current.getGeometry();
            if (smallestGeom && currentGeom) {
                return getArea(currentGeom) < getArea(smallestGeom) ? current : smallest;
            }
            return smallest;
        });
      }

      const highlightSource = highlightLayer.current?.getSource();
      if (!highlightSource) return;

      // Update highlight
      if (topFeature !== selectedFeature) {
        if (selectedFeature) {
            highlightSource.removeFeature(selectedFeature as Feature<Geometry>);
        }
        if (topFeature) {
            highlightSource.addFeature(topFeature as Feature<Geometry>);
        }
        selectedFeature = topFeature || null;
      }
      
      // Update tooltip
      const currentTempData = regionTempDataRef.current;
      if (topFeature && currentTempData) {
        const regionAcronym = topFeature.get('Acronym');
        const regionName = topFeature.get('Name');
        const temp = currentTempData.regionTemps[regionAcronym];
    
        if (temp !== undefined) {
          tooltipRef.current.innerHTML = `<b>${regionName} (${regionAcronym})</b><br>${temp.toFixed(
            2
          )}°C`;
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
        allFeaturesRef.current = features;
        // Initial load with data if available
        const source = regionsLayer.current?.getSource();
        if(source && regionTempDataRef.current) {
            const featuresWithData = allFeaturesRef.current.filter(feature => {
                const acronym = feature.get('Acronym');
                return regionTempDataRef.current!.regionTemps[acronym] !== undefined;
            });
            featuresWithData.sort(sortFeatures);
            source.addFeatures(featuresWithData);
        }
      })
      .catch(error => {
        console.error(error);
      });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.dispose();
        mapInstance.current = null;
      }
    };
  }, []);

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
