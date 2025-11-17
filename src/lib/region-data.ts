
export type RegionTemperatures = {
  [regionAcronym: string]: number;
};

export type RegionYearlyTemperatureData = {
  year: number;
  regionTemps: RegionTemperatures;
};

export type Scenario = 'SSP1' | 'SSP2' | 'SSP3' | 'SSP5';
type InternalScenario = Scenario | 'Historical';

const scenarioFiles: Record<InternalScenario, string> = {
  'Historical': '/data/CMIP6_ACCESS-CM2_historical_r1i1p1f1.csv',
  'SSP1': '/data/CMIP6_ACCESS-CM2_ssp126_r1i1p1f1.csv',
  'SSP2': '/data/CMIP6_ACCESS-CM2_ssp245_r1i1p1f1.csv',
  'SSP3': '/data/CMIP6_ACCESS-CM2_ssp370_r1i1p1f1.csv',
  'SSP5': '/data/CMIP6_ACCESS-CM2_ssp585_r1i1p1f1.csv',
};

let cachedData: { [scenario in InternalScenario]?: { [year: number]: RegionTemperatures } } = {};
let allYears: { [scenario in InternalScenario]?: number[] } = {};

async function parseCSV(scenario: InternalScenario): Promise<void> {
  if (cachedData[scenario]) {
    return;
  }
  
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
    regionAcronyms.forEach(acronym => {
      const { sum, count } = yearlyAverages[year][acronym];
      scenarioData[year][acronym] = count > 0 ? sum / count : 0;
    });
  });

  cachedData[scenario] = scenarioData;
  allYears[scenario] = Object.keys(scenarioData).map(Number).sort((a, b) => a - b);
}

async function ensureDataLoaded(scenario: InternalScenario) {
  if (!cachedData[scenario]) {
    await parseCSV(scenario);
  }
}

async function ensureCombinedDataLoaded(scenario: Scenario) {
    await ensureDataLoaded('Historical');
    await ensureDataLoaded(scenario);
}

export async function getCombinedDataForYear(scenario: Scenario, year: number): Promise<RegionYearlyTemperatureData> {
    await ensureCombinedDataLoaded(scenario);
    
    const historicalData = cachedData['Historical'];
    const scenarioData = cachedData[scenario];

    if (historicalData && historicalData[year]) {
        return { year, regionTemps: historicalData[year] };
    }

    if (scenarioData && scenarioData[year]) {
        return { year, regionTemps: scenarioData[year] };
    }

    throw new Error(`Data for year ${year} in scenario ${scenario} not found.`);
}


export async function getCombinedYears(scenario: Scenario): Promise<number[]> {
    await ensureCombinedDataLoaded(scenario);
    
    const historicalYears = allYears['Historical'] || [];
    const scenarioYears = allYears[scenario] || [];

    const combined = Array.from(new Set([...historicalYears, ...scenarioYears])).sort((a, b) => a - b);
    return combined;
}
