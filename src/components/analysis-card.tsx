'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BrainCircuit } from 'lucide-react';

type AnalysisCardProps = {
  analysis: string | null;
  isLoading: boolean;
};

export default function AnalysisCard({ analysis, isLoading }: AnalysisCardProps) {
  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-2xl">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <BrainCircuit className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg font-medium">AI Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[75%]" />
            <Skeleton className="h-4 w-[80%]" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{analysis}</p>
        )}
      </CardContent>
    </Card>
  );
}
