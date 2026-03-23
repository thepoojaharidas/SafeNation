// API endpoints for real-time environmental data in Singapore
const WEATHER_URL =
  "https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast";
const PSI_URL = "https://api-open.data.gov.sg/v2/real-time/api/psi";
const FLOOD_URL =
  "https://api-open.data.gov.sg/v2/real-time/api/weather/flood-alerts";
const RAINFALL_URL = "https://api-open.data.gov.sg/v2/real-time/api/rainfall";

// reusable function to fetch data with basic error and rate limit handling
async function fetchJson(url, label) {
  try {
    const response = await fetch(url);

    // handle API rate limiting (too many requests)
    if (response.status === 429) {
      console.warn(`${label} rate limited (429)`);
      return { rateLimited: true };
    }

    // throw error if response is not successful
    if (!response.ok) {
      throw new Error(`${label} request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`${label} fetch error:`, error);
    return null;
  }
}

// fetch 2-hour weather forecast data
export async function fetchWeatherForecast() {
  return fetchJson(WEATHER_URL, "Weather");
}

// fetch air quality (PSI) data
export async function fetchPSI() {
  return fetchJson(PSI_URL, "PSI");
}

// fetch flood alert data
export async function fetchFloodAlerts() {
  return fetchJson(FLOOD_URL, "Flood");
}

// fetch real-time rainfall data
export async function fetchRainfall() {
  return fetchJson(RAINFALL_URL, "Rainfall");
}
