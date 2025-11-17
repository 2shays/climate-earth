export type TemperaturePoint = {
  lat: number;
  lng: number;
  temp: number;
};

export type YearlyTemperatureData = {
  year: number;
  data: TemperaturePoint[];
};

function generateTemperatureData(year: number, numPoints: number): TemperaturePoint[] {
  const data: TemperaturePoint[] = [];
  const yearOffset = year - 2023;

  for (let i = 0; i < numPoints; i++) {
    const lat = Math.random() * 180 - 90;
    const lng = Math.random() * 360 - 180;

    // Simulate temperature based on latitude (colder at poles)
    const baseTemp = 28 - (Math.abs(lat) / 90) * 50;
    
    // Add a yearly warming trend
    const warmingTrend = yearOffset * 0.5;
    
    // Add some random noise
    const noise = (Math.random() - 0.5) * 5;

    const temp = baseTemp + warmingTrend + noise;

    data.push({ lat, lng, temp: parseFloat(temp.toFixed(2)) });
  }
  return data;
}

export const mockTemperatureData: YearlyTemperatureData[] = [
  {
    year: 2023,
    data: generateTemperatureData(2023, 150),
  },
  {
    year: 2024,
    data: generateTemperatureData(2024, 150),
  },
  {
    year: 2025,
    data: generateTemperatureData(2025, 150),
  },
];

export const MOCK_YEARS = mockTemperatureData.map(d => d.year);
export const TEMP_RANGE = { min: -30, max: 40 };
