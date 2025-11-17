'use client';

import 'ol/ol.css';
import React, { useRef, useEffect } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Heatmap from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import type { TemperaturePoint } from '@/lib/data';
import { TEMP_RANGE } from '@/lib/data';

type MapComponentProps = {
  temperatureData: TemperaturePoint[];
};

export default function MapComponent({ temperatureData }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const heatmapLayer = useRef<Heatmap | null>(null);
  const vectorSource = useRef<VectorSource | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    vectorSource.current = new VectorSource();

    heatmapLayer.current = new Heatmap({
      source: vectorSource.current,
      blur: 15,
      radius: 10,
      weight: (feature) => {
        const temp = feature.get('temp');
        return (temp - TEMP_RANGE.min) / (TEMP_RANGE.max - TEMP_RANGE.min);
      },
    });

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        heatmapLayer.current,
      ],
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 2,
      }),
    });
    
    return () => {
      mapInstance.current?.setTarget(undefined);
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!vectorSource.current) return;

    const features = temperatureData.map(point => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([point.lng, point.lat])),
        temp: point.temp,
      });
      return feature;
    });

    vectorSource.current.clear();
    vectorSource.current.addFeatures(features);
  }, [temperatureData]);

  return <div ref={mapRef} className="h-full w-full" />;
}