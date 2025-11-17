
export type RegionTemperatures = {
  [regionAcronym: string]: number;
};

export type RegionYearlyTemperatureData = {
  year: number;
  regionTemps: RegionTemperatures;
};

export type Scenario = 'SSP1' | 'SSP2' | 'SSP3' | 'SSP5';

const scenarioFiles: { [key in Scenario | 'Historical']: string } = {
  'Historical': '/data/CMIP6_ACCESS-CM2_historical_r1i1p1f1.csv',
  'SSP1': '/data/CMIP6_ACCESS-CM2_ssp126_r1i1p1f1.csv',
  'SSP2': '/data/CMIP6_ACCESS-CM2_ssp245_r1i1p1f1.csv',
  'SSP3': '/data/CMIP6_ACCESS-CM2_ssp370_r1i1p1f1.csv',
  'SSP5': '/data/CMIP6_ACCESS-CM2_ssp585_r1i1p1f1.csv',
};

async function parseAndProcessCSV(filePath: string): Promise<{ [year: number]: RegionTemperatures }> {
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV data from ${filePath}`);
  }
  const csvText = await response.text();
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    return {};
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const regionAcronyms = headers.slice(1);
  
  const yearlyAverages: { [year: number]: { [region: string]: { sum: number, count: number } } } = {};

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < headers.length) continue;

    const date = values[0];
    const year = parseInt(date.substring(0, 4), 10);
    if (isNaN(year)) continue;

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

  const processedData: { [year: number]: RegionTemperatures } = {};
  Object.keys(yearlyAverages).forEach(yearStr => {
    const year = parseInt(yearStr, 10);
    processedData[year] = {};
    regionAcronyms.forEach(acronym => {
      const { sum, count } = yearlyAverages[year][acronym];
      processedData[year][acronym] = count > 0 ? sum / count : 0;
    });
  });

  return processedData;
}

const cachedData: { [key: string]: { [year: number]: RegionTemperatures } } = {};

async function loadAndCombineData(scenario: Scenario): Promise<{ [year: number]: RegionTemperatures }> {
    if (cachedData[scenario]) {
        return cachedData[scenario];
    }

    const [historicalData, futureData] = await Promise.all([
        parseAndProcessCSV(scenarioFiles['Historical']),
        parseAndProcessCSV(scenarioFiles[scenario])
    ]);
    
    const combinedData = { ...historicalData, ...futureData };
    cachedData[scenario] = combinedData;
    return combinedData;
}


export async function getCombinedDataForYear(scenario: Scenario, year: number): Promise<RegionYearlyTemperatureData> {
  const combinedData = await loadAndCombineData(scenario);

  if (combinedData && combinedData[year]) {
    return { year, regionTemps: combinedData[year] };
  }

  throw new Error(`Data for year ${year} in scenario ${scenario} not found.`);
}

export async function getCombinedYears(scenario: Scenario): Promise<number[]> {
  const combinedData = await loadAndCombineData(scenario);
  return Object.keys(combinedData).map(Number).sort((a, b) => a - b);
}
