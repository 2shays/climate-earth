export type RegionTemperatures = {
  [regionAcronym: string]: number;
};

export type RegionYearlyTemperatureData = {
  year: number;
  regionTemps: RegionTemperatures;
};

let cachedData: { [year: number]: RegionTemperatures } | null = null;
let regionAcronyms: string[] | null = null;
let allYears: number[] | null = null;

async function parseCSV(): Promise<void> {
  const response = await fetch('/data/CMIP6_ACCESS-CM2_historical_r1i1p1f1.csv');
  if (!response.ok) {
    throw new Error('Failed to fetch CSV data');
  }
  const csvText = await response.text();
  const lines = csvText.trim().split('\n');
  
  const headers = lines[0].split(',').map(h => h.trim());
  regionAcronyms = headers.slice(1);
  
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

  cachedData = {};
  Object.keys(yearlyAverages).forEach(yearStr => {
    const year = parseInt(yearStr, 10);
    cachedData![year] = {};
    regionAcronyms!.forEach(acronym => {
      const { sum, count } = yearlyAverages[year][acronym];
      cachedData![year][acronym] = count > 0 ? sum / count : 0;
    });
  });

  allYears = Object.keys(cachedData).map(Number).sort((a, b) => a - b);
}

async function ensureDataLoaded() {
  if (cachedData === null) {
    await parseCSV();
  }
}

export async function getRegionDataForYear(year: number): Promise<RegionYearlyTemperatureData> {
  await ensureDataLoaded();
  if (cachedData && cachedData[year]) {
    return { year, regionTemps: cachedData[year] };
  }
  throw new Error(`Data for year ${year} not found.`);
}

export async function getRegionYears(): Promise<number[]> {
  await ensureDataLoaded();
  return allYears || [];
}
