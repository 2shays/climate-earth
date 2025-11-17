'use client';

import React, { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api';
import type { TemperaturePoint } from '@/lib/data';
import { TEMP_RANGE } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { mapStyles } from '@/lib/map-styles';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 20,
  lng: 0
};

const mapOptions = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
};

type MapComponentProps = {
  temperatureData: TemperaturePoint[];
};

export default function MapComponent({ temperatureData }: MapComponentProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['visualization']
  });

  const heatmapData = useMemo(() => {
    if (!isLoaded) return [];
    return temperatureData.map(point => ({
      location: new google.maps.LatLng(point.lat, point.lng),
      weight: (point.temp - TEMP_RANGE.min) / (TEMP_RANGE.max - TEMP_RANGE.min)
    }));
  }, [temperatureData, isLoaded]);

  if (!isLoaded) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={3}
      options={mapOptions}
    >
      {heatmapData.length > 0 && (
        <HeatmapLayer
          data={heatmapData}
          options={{
            radius: 20,
            opacity: 0.8,
            gradient: [
              'rgba(102, 178, 255, 0)',
              'rgba(102, 178, 255, 1)',
              'rgba(127, 255, 212, 1)',
              'rgba(255, 255, 0, 1)',
              'rgba(255, 165, 0, 1)',
              'rgba(255, 127, 80, 1)',
            ]
          }}
        />
      )}
    </GoogleMap>
  );
}
