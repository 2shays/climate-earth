'use server';

import { generateYearlyAnalysis } from '@/ai/flows/generate-yearly-analysis';
import type { TemperaturePoint } from '@/lib/data';

export async function getAnalysisForYear(year: number, data: TemperaturePoint[]) {
  if (!data || data.length === 0) {
    return { analysis: `No temperature data is available for the year ${year}.` };
  }

  // Create a simple description of the data for the AI prompt
  const temps = data.map(p => p.temp);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;

  const temperatureDataDescription = `A dataset of global temperature readings.
    Maximum Temperature: ${maxTemp.toFixed(1)}°C
    Minimum Temperature: ${minTemp.toFixed(1)}°C
    Average Temperature: ${avgTemp.toFixed(1)}°C
  `;

  try {
    const result = await generateYearlyAnalysis({
      year,
      temperatureDataDescription,
    });
    return result;
  } catch (error) {
    console.error('Error generating analysis:', error);
    // Return a user-friendly error message
    return { analysis: 'Could not generate an analysis at this time. Please try again later.' };
  }
}
