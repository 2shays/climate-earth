'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import type { TemperaturePoint } from '@/lib/data';
import { TEMP_RANGE } from '@/lib/data';
import { mapStyles } from '@/lib/map-styles';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal } from 'lucide-react';

type HeatmapProps = {
  data: google.maps.visualization.WeightedLocation[];
};

const HeatmapLayer = ({ data }: HeatmapProps) => {
  const map = useMap();
  const [heatmap, setHeatmap] = useState<google.maps.visualization.HeatmapLayer | null>(null);

  useEffect(() => {
    if (!map) return;
    
    // Ensure visualization library is loaded
    if (!google.maps.visualization) {
      console.error("Google Maps Visualization library is not loaded.");
      return;
    }

    if (!heatmap) {
      const newHeatmap = new google.maps.visualization.HeatmapLayer({
        data,
        map,
        gradient: [
          'rgba(102, 178, 255, 0)', // primary color (sky blue) with 0 opacity
          'rgba(102, 178, 255, 1)',
          'rgba(127, 255, 212, 1)', // Aquamarine
          'rgba(255, 255, 0, 1)', // Yellow
          'rgba(255, 165, 0, 1)', // Orange
          'rgba(255, 127, 80, 1)', // accent color (coral red)
        ],
        radius: 30,
        opacity: 0.7,
      });
      setHeatmap(newHeatmap);
    } else {
      heatmap.setData(data);
    }
    
    // Cleanup on unmount
    return () => {
      if(heatmap) {
        heatmap.setMap(null);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, data]);


  return null;
};

type MapComponentProps = {
  temperatureData: TemperaturePoint[];
};

export default function MapComponent({ temperatureData }: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const heatmapData = useMemo(() => {
    return temperatureData.map(point => ({
      location: new google.maps.LatLng(point.lat, point.lng),
      weight: (point.temp - TEMP_RANGE.min) / (TEMP_RANGE.max - TEMP_RANGE.min),
    }));
  }, [temperatureData]);

  if (!apiKey) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted p-4">
        <Alert variant="destructive" className="max-w-md">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Google Maps API Key Missing</AlertTitle>
            <AlertDescription>
            Please add your Google Maps API key to a <code>.env.local</code> file to display the map.
            <br />
            Example: <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_KEY_HERE"</code>
            </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['visualization']}>
      <Map
        defaultCenter={{ lat: 20, lng: 0 }}
        defaultZoom={2.5}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        styles={mapStyles}
        mapId="temporal-atlas-map"
      >
        <HeatmapLayer data={heatmapData} />
      </Map>
    </APIProvider>
  );
}
