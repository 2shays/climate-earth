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

## Public Access & Deployment
This application is deployed using **Firebase App Hosting**.

### How it Works
- **Link Persistence:** The public URL is permanent. It does not expire and will remain active as long as the App Hosting backend is maintained.
- **Data Serving:** All climate datasets (CSV) and map geometries (GeoJSON) are served as static assets from the `public` directory, ensuring they are accessible to all users of the dashboard.
- **Automatic Scaling:** The hosting environment automatically manages server instances to handle incoming traffic based on the configuration in `apphosting.yaml`.

### Limitations
- **Client-Side Rendering:** The map renders complex geometries and data points directly in the user's browser. Older mobile devices or browsers may experience performance lag.
- **Usage Quotas:** High volumes of traffic are subject to Firebase and Google Cloud platform quotas. For small to medium audiences, the standard limits are typically sufficient.
