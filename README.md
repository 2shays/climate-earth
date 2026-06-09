# Temporal Atlas

Temporal Atlas is an interactive climate visualization tool that maps global temperature trends from **1850 through 2100**.

## What it shows
It utilizes regional mean temperature data from **CMIP6 climate models** (specifically the ACCESS-CM2 model) to illustrate historical patterns and projected future scenarios based on different **Shared Socioeconomic Pathways (SSPs)**.

### Key Features
- **Temporal Exploration:** A time-traveling slider allowing users to see global shifts year-over-year.
- **Scenario Comparison:** Real-time switching between four distinct future pathways—from high sustainability (SSP1) to fossil-fueled development (SSP5).
- **Regional Specificity:** Interactive map regions that provide local temperature averages and anomalies relative to pre-industrial levels (1850–1900).

## Comparison with the IPCC Interactive Atlas
While inspired by the same data used by the Intergovernmental Panel on Climate Change (IPCC), the Temporal Atlas is built for accessibility:

- **Streamlined focus:** Unlike the official research tool which features hundreds of variables, we focus purely on Mean Annual Temperature to make the narrative clear.
- **Accessible Design:** Prioritizes a clean, single-view interactive experience over complex scientific statistical controls.
- **Contextual Anomalies:** Highlights the "vs. Pre-industrial" metric to help users understand the scale of current and future warming in a relatable context.

## Public Preview Access
This application is currently shared via a **Public Preview URL** from Firebase Studio.

### How it Works
- **Live Updates:** This link provides a real-time view of the development environment. Any changes made to the code are reflected immediately for anyone viewing the link.
- **Persistence:** The link remains active as long as the development workstation is running. It is intended for testing, feedback, and demonstration purposes.
- **Data Serving:** Climate datasets (CSV) and map geometries (GeoJSON) are served directly from the development server, ensuring the map is fully interactive for all viewers.

### Technical Limitations
- **Development Build:** The preview runs in development mode, which may not be as highly optimized as a final production deployment.
- **Hardware Requirements:** The map renders complex geometries in the browser. A stable internet connection and a modern browser are recommended for the best experience.
