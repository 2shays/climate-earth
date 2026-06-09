
export type TemperaturePoint = {
  lat: number;
  lng: number;
  temp: number;
};

export type YearlyTemperatureData = {
  year: number;
  data: TemperaturePoint[];
};

export const TEMP_RANGE = { min: -20, max: 35 };
export const MAP_OVERLAY_OPACITY = 0.45;
