'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a short descriptive analysis of yearly temperature data.
 *
 * The flow takes a year as input and returns a text analysis of the temperature data for that year.
 * - generateYearlyAnalysis - A function that generates the analysis.
 * - GenerateYearlyAnalysisInput - The input type for the generateYearlyAnalysis function.
 * - GenerateYearlyAnalysisOutput - The return type for the generateYearlyAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateYearlyAnalysisInputSchema = z.object({
  year: z.number().describe('The year for which to generate the temperature analysis.'),
  temperatureDataDescription: z.string().describe('Description of the current temperature data'),
});
export type GenerateYearlyAnalysisInput = z.infer<typeof GenerateYearlyAnalysisInputSchema>;

const GenerateYearlyAnalysisOutputSchema = z.object({
  analysis: z.string().describe('A short descriptive analysis of the temperature data for the given year.'),
});
export type GenerateYearlyAnalysisOutput = z.infer<typeof GenerateYearlyAnalysisOutputSchema>;

export async function generateYearlyAnalysis(input: GenerateYearlyAnalysisInput): Promise<GenerateYearlyAnalysisOutput> {
  return generateYearlyAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateYearlyAnalysisPrompt',
  input: {schema: GenerateYearlyAnalysisInputSchema},
  output: {schema: GenerateYearlyAnalysisOutputSchema},
  prompt: `You are an expert climate analyst. Given the year and a description of the temperature data for that year, generate a concise analysis highlighting key trends and anomalies.

Year: {{{year}}}
Data Description: {{{temperatureDataDescription}}}

Analysis:`,
});

const generateYearlyAnalysisFlow = ai.defineFlow(
  {
    name: 'generateYearlyAnalysisFlow',
    inputSchema: GenerateYearlyAnalysisInputSchema,
    outputSchema: GenerateYearlyAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
