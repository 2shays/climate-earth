
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { getCombinedDataForYear, RegionYearlyTemperatureData, Scenario } from '@/lib/region-data';
import { SCENARIOS } from '@/lib/scenarios';
import MapComponent from './map-component';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { calculateGlobalMean } from './temporal-atlas-view';

type ComparisonViewProps = {
  selectedYear: number | undefined;
  preIndustrialAverage: number | null;
};

type ScenarioData = {
  scenario: typeof SCENARIOS[number];
  data: RegionYearlyTemperatureData | undefined;
};

export default function ComparisonView({ selectedYear, preIndustrialAverage }: ComparisonViewProps) {
  const [scenarioData, setScenarioData] = useState<ScenarioData[]>([]);
  const [isDataLoading, startDataTransition] = useTransition();

  useEffect(() => {
    if (selectedYear === undefined) return;

    startDataTransition(() => {
      const fetchData = async () => {
        const dataPromises = SCENARIOS.map(async (scenario) => {
          try {
            const data = await getCombinedDataForYear(scenario.id, selectedYear);
            return { scenario, data };
          } catch (error) {
            console.error(`Failed to load data for ${scenario.id} in year ${selectedYear}:`, error);
            return { scenario, data: undefined };
          }
        });
        const results = await Promise.all(dataPromises);
        setScenarioData(results);
      };
      fetchData();
    });
  }, [selectedYear]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full gap-1 p-1 pt-24 pb-32">
        {isDataLoading && (
             <div className={`absolute inset-0 z-10 bg-background/50 transition-opacity duration-300 opacity-100 pointer-events-none`} />
        )}
      {SCENARIOS.map(({ id, name }) => {
        const currentData = scenarioData.find(d => d.scenario.id === id)?.data;
        const globalAverageTemp = useMemo(() => calculateGlobalMean(currentData), [currentData]);
        const temperatureAnomaly = useMemo(() => {
          if (globalAverageTemp === null || preIndustrialAverage === null) return null;
          return globalAverageTemp - preIndustrialAverage;
        }, [globalAverageTemp, preIndustrialAverage]);

        return (
          <div key={id} className="relative rounded-lg overflow-hidden border">
            <MapComponent regionTemperatureData={currentData} />
            <Card className="absolute top-2 left-2 bg-card/80 backdrop-blur-sm w-auto">
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium">{name}</CardTitle>
              </CardHeader>
              {(globalAverageTemp !== null || temperatureAnomaly !== null) && (
                <CardContent className="p-3 pt-0 grid grid-cols-2 gap-2">
                   {globalAverageTemp !== null && (
                        <div>
                            <div className="text-xs text-muted-foreground">Mean</div>
                            <div className="text-lg font-bold text-card-foreground">
                                {globalAverageTemp.toFixed(2)}°C
                            </div>
                        </div>
                    )}
                    {temperatureAnomaly !== null && (
                        <div>
                            <div className="text-xs text-muted-foreground">Anomaly</div>
                            <div className={`text-lg font-bold ${temperatureAnomaly > 0 ? 'text-accent' : 'text-primary'}`}>
                                {temperatureAnomaly > 0 ? '+' : ''}{temperatureAnomaly.toFixed(2)}°C
                            </div>
                        </div>
                    )}
                </CardContent>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}

