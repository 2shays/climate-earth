
export type RegionTemperatures = {
  [regionAcronym: string]: number;
};

export type RegionYearlyTemperatureData = {
  year: number;
  regionTemps: RegionTemperatures;
};

export type Scenario = 'Historical' | 'SSP1';

const scenarioFiles: Record<Scenario, string> = {
  'Historical': '/data/CMIP6_ACCESS-CM2_historical_r1i1p1f1.csv',
  'SSP1': '/data/CMIP6_ACCESS-CM2_ssp126_r1i1p1f1.csv',
};

let cachedData: { [scenario in Scenario]?: { [year: number]: RegionTemperatures } } = {};
let allYears: { [scenario in Scenario]?: number[] } = {};

async function parseCSV(scenario: Scenario): Promise<void> {
  const filePath = scenarioFiles[scenario];
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV data for ${scenario} from ${filePath}`);
  }
  const csvText = await response.text();
  const lines = csvText.trim().split('\n');
  
  const headers = lines[0].split(',').map(h => h.trim());
  const regionAcronyms = headers.slice(1);
  
  const yearlyAverages: { [year: number]: { [region: string]: { sum: number, count: number } } } = {};

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const date = values[0];
    // Handle different date formats if necessary, assuming YYYY-MM-DD or YYYY-M-D
    const year = parseInt(date.substring(0, 4), 10);

    if (!yearlyAverages[year]) {
      yearlyAverages[year] = {};
      regionAcronyms.forEach(acronym => {
        yearlyAverages[year][acronym] = { sum: 0, count: 0 };
      });
    }

    for (let j = 1; j < headers.length; j++) {
      const region = headers[j];
      const temp = parseFloat(values[j]);
      if (!isNaN(temp)) {
        yearlyAverages[year][region].sum += temp;
        yearlyAverages[year][region].count++;
      }
    }
  }

  const scenarioData: { [year: number]: RegionTemperatures } = {};
  Object.keys(yearlyAverages).forEach(yearStr => {
    const year = parseInt(yearStr, 10);
    scenarioData[year] = {};
    regionAcronyms!.forEach(acronym => {
      const { sum, count } = yearlyAverages[year][acronym];
      scenarioData[year][acronym] = count > 0 ? sum / count : 0;
    });
  });

  cachedData[scenario] = scenarioData;
  allYears[scenario] = Object.keys(scenarioData).map(Number).sort((a, b) => a - b);
}

async function ensureDataLoaded(scenario: Scenario) {
  if (!cachedData[scenario]) {
    await parseCSV(scenario);
  }
}

export async function getRegionDataForYear(scenario: Scenario, year: number): Promise<RegionYearlyTemperatureData> {
  await ensureDataLoaded(scenario);
  const scenarioCache = cachedData[scenario];
  if (scenarioCache && scenarioCache[year]) {
    return { year, regionTemps: scenarioCache[year] };
  }
  throw new Error(`Data for year ${year} in scenario ${scenario} not found.`);
}

export async function getRegionYears(scenario: Scenario): Promise<number[]> {
  await ensureDataLoaded(scenario);
  return allYears[scenario] || [];
}
