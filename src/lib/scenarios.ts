
import { Scenario } from "./region-data";

export const SCENARIOS: { id: Scenario, name: string, description: string }[] = [
    { 
        id: 'SSP1', 
        name: 'SSP1: Sustainability',
        description: 'This pathway describes a sustainable world with investments in education and health, reduced inequality, and a shift towards less material and energy-intensive consumption, resulting in low challenges for both mitigation and adaptation.'
    },
    { 
        id: 'SSP2', 
        name: 'SSP2: Middle of the Road',
        description: 'This scenario reflects a world following historical patterns of development, with slow progress towards sustainability and ongoing environmental degradation, presenting challenges to reducing vulnerability.'
    },
    { 
        id: 'SSP3', 
        name: 'SSP3: Regional Rivalry',
        description: 'Characterized by nationalism, slow economic growth, high material consumption, and persistent inequalities, this pathway faces high challenges for both mitigation and adaptation.'
    },
    { 
        id: 'SSP5', 
        name: 'SSP5: Fossil-Fueled Development',
        description: 'This pathway depicts rapid economic growth reliant on fossil fuels and technological innovation, creating high mitigation challenges due to high energy demand, but low adaptation challenges due to available resources.'
    },
];
