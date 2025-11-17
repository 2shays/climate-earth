export type TemperaturePoint = {
  lat: number;
  lng: number;
  temp: number;
};

export type YearlyTemperatureData = {
  year: number;
  data: TemperaturePoint[];
};

export const TEMP_RANGE = { min: -5, max: 5 };
