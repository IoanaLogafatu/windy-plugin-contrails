<div class="plugin__mobile-header">
    {title}
</div>
<section class="plugin__content">
    <div
        class="plugin__title plugin__title--chevron-back"
        on:click={() => bcast.emit('rqstOpen', 'menu')}
    >
        {title}
    </div>

    <div class="weather-stats">
        <div class="stat">
            <label>Height:</label>
            <span>{height} ft</span>
        </div>
        <div class="stat">
            <label>Pressure:</label>
            <span>{pressure} hPa</span>
        </div>
        <div class="stat">
            <label>Temperature:</label>
            <span>{temperture} °C</span>
        </div>
        <div class="stat">
            <label>Dewpoint:</label>
            <span>{dewpoint} °C</span>
        </div>
        <div class="stat">
            <label>Relative Humidity:</label>
            <span>{humidity} %</span>
        </div>
        <div class="ice">
            <label>Saturation Relative to Ice:</label>
            <span>{ice} %</span>
        </div>
    </div>
</section>

<script lang="ts">
    import bcast from '@windy/broadcast';
    import { onDestroy, onMount } from 'svelte';
    import config from './pluginConfig';
    import { singleclick } from '@windy/singleclick';
    import windyFetch from '@windy/fetch';
    import { humidityLookupTable } from './humidityLookup'; // Adjust the path as necessary based on your project structure

    const { title } = config;

    let temperture = '';
    let dewpoint = '';
    let humidity = '';
    let ice = '';
    let height = '';
    let pressure = '';

    export const onopen = (_params: any) => {
        // Your plugin was opened with parameters parsed from URL
        // or with LatLon object if opened from contextmenu
    };

    /**
     * Sets up an event listener for single clicks on the map within the Svelte component lifecycle.
     * When the component is mounted, this function registers an event listener that triggers when a user clicks on the map.
     * The latitude and longitude from the click event are used to fetch weather data specific to that location.
     * The fetched data is then passed to `updateWeatherStats` to update the UI accordingly.
     * If fetching the data fails, an error will be logged to the console.
     *
     * Utilizes the `singleclick` event from the Windy API's plugin framework, demonstrating asynchronous data fetching
     * and handling within a reactive Svelte component setup.
     */
    onMount(() => {
        singleclick.on('windy-plugin-contrails', async ev => {
            try {
                const weatherData = await fetchData(ev.lat, ev.lon);
                updateWeatherStats(weatherData);
            } catch (error) {
                console.error('* * * An error occurred:', error);
            }
        });
    });

    onDestroy(() => {
        // Your plugin was destroyed
    });

    /**
     * Fetches meteorological data for a specific geographic location using the Windy API.
     * This function queries the API for meteorogram forecast data based on latitude and longitude,
     * specifically focusing on data projections at intervals defined by 'step'.
     * The 'ukv' model is used for the forecast data retrieval, which is a model used within the UK.
     *
     * @param {number} lat - The latitude coordinate for the location of interest.
     * @param {number} lon - The longitude coordinate for the location of interest.
     * @returns {Promise<any>} A promise that resolves with the forecast data retrieved from the Windy API.
     */
    const fetchData = (lat: number, lon: number) => {
        return windyFetch.getMeteogramForecastData('ukv', {
            lat: lat,
            lon: lon,
            step: 3,
        });
    };

    /**
     * Updates the weather statistics by processing the data retrieved for the 300hPa atmospheric layer.
     * This function parses and converts meteorological data from Kelvin to Celsius for temperature and dewpoint,
     * formats humidity and calculates the average relative humidity with respect to ice using the current temperature.
     * It also converts height from meters to feet. The function assumes that all data is related to the 300hPa pressure level.
     *
     * @param {any} weatherData - The raw weather data object retrieved from the weather API.
     *                           Expected to contain temperature, dewpoint, relative humidity,
     *                           and geopotential height data at 300hPa.
     */
    const updateWeatherStats = (weatherData: any) => {
        /**
         * For the moment, I am only looking at 300hPa layer
         */
        console.log('* * * AIR data:', weatherData);  // Displaying in log for interest only
        temperture = (weatherData.data.data['temp-300h'][0] - 273.15).toFixed(0); // Covert to Celsius
        dewpoint = (weatherData.data.data['dewpoint-300h'][0] - 273.15).toFixed(0); // Should really to be user preference
        humidity = weatherData.data.data['rh-300h'][0].toFixed(0);
        ice = getAverageRHw(+temperture);
        const heightInMeters = weatherData.data.data['gh-300h'][0];
        height = (heightInMeters * 3.28084).toFixed(0);
        pressure = '300';
    };

    /**
     * Calculates the average relative humidity with respect to ice between two bounding temperatures.
     * This function retrieves the relative humidity values for the lower and upper bounding temperatures
     * from a predefined lookup table and returns their average.
     *
     * @param {number} temp - The temperature for which the average relative humidity needs to be calculated.
     * @returns {string} The average relative humidity as a string, formatted to one decimal place.
     * If the bounding temperatures are not found in the lookup table, returns a specific error message.
     */
    function getAverageRHw(temp: number): string {
        // Find the bounding temperatures for the lookup
        const lowerBoundTemp = Math.floor(temp / 2) * 2;
        const upperBoundTemp = lowerBoundTemp + 2;

        // Convert bounds to string to match the lookup table keys
        const lowerBoundKey = lowerBoundTemp.toString();
        const upperBoundKey = upperBoundTemp.toString();

        // Check if both bounds exist in the lookup table
        if (
            humidityLookupTable[lowerBoundKey] !== undefined &&
            humidityLookupTable[upperBoundKey] !== undefined
        ) {
            // Calculate the average of the two bounding values
            const averageRHw =
                (humidityLookupTable[lowerBoundKey] + humidityLookupTable[upperBoundKey]) / 2;
            return averageRHw.toFixed(1); // Format to one decimal place
        } else {
            // If one or both bounds don't exist, handle accordingly
            return 'Bounds not found in lookup table';
        }
    }
</script>

<style lang="less">
    .weather-stats {
        display: flex;
        flex-direction: column;
        padding: 10px;
        label {
            font-weight: bold;
        }
        .stat {
            margin-bottom: 5px;
        }
    }
</style>
