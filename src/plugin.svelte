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
        <table>
            <thead>
                <tr>
                    <th>Height</th>
                    <th>Temperature</th>
                    <th>Relative Humidity</th>
                    <th>Saturation Relative to Ice</th>
                </tr>
            </thead>
            <tbody>
                {#each flightLevels as { height, humidity, ice, temperature }}
                    <tr>
                        <td>{height}&nbsp;ft</td>
                        <td>{temperature}&nbsp;C</td>
                        <td>{humidity}&nbsp;%</td>
                        <td>{ice}&nbsp;%</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</section>

<script lang="ts">
    import bcast from '@windy/broadcast';
    import { onDestroy, onMount } from 'svelte';
    import config from './pluginConfig';
    import { singleclick } from '@windy/singleclick';
    import windyFetch from '@windy/fetch';
    import { humidityLookupTable } from './humidityLookup';
    import { Sounding } from './sounding.interface';
    import {
        MeteogramDataPayload,
        MeteogramDataHash,
    } from '@windycom/plugin-devtools/types/interfaces';

    const { title } = config;

    let flightLevels: Sounding[] = [];

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
                updateWeatherStats(weatherData.data);
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
     * @param any weatherData - The raw weather data object retrieved from the weather API.
     *                           Expected to contain temperature, dewpoint, relative humidity,
     *                           and geopotential height data at 300hPa.
     */
    const updateWeatherStats = (weatherData: MeteogramDataPayload) => {
        flightLevels = []; // Array to store data for each layer

        // Loop over all properties in weatherData.data.data
        for (const key in weatherData.data) {
            if (key.startsWith('gh-')) {
                const suffix = key.split('gh-')[1]; // Get the suffix to match other data
                const tempKey = `temp-${suffix}`;
                const dewpointKey = `dewpoint-${suffix}`;
                const humidityKey = `rh-${suffix}`;

                const heightInMeters = +weatherData.data[key as keyof MeteogramDataHash][0];
                const height = +(heightInMeters * 3.28084).toFixed(0); // Convert to feet
                const temperature = +(
                    weatherData.data[tempKey as keyof MeteogramDataHash][0] - 273.15
                ).toFixed(0); // Convert Kelvin to Celsius
                const dewpoint = +(
                    weatherData.data[dewpointKey as keyof MeteogramDataHash][0] - 273.15
                ).toFixed(0);
                const humidity =
                    +weatherData.data[humidityKey as keyof MeteogramDataHash][0].toFixed(0);
                const ice = +getAverageRHw(+temperature); // Assuming getAverageRHw function exists and works with temperature

                if (ice > 0) {
                    flightLevels.push({
                        suffix,
                        height,
                        temperature,
                        dewpoint,
                        humidity,
                        ice,
                    });
                }
            }
        }
        // Sorting the array by height in descending order
        flightLevels.sort((a, b) => b.height - a.height);

        console.log('* * * Processed Layers Data:', flightLevels);
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
    function getAverageRHw(temp: number): number {
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
            return +averageRHw.toFixed(1); // Format to one decimal place
        } else {
            // If one or both bounds don't exist, handle accordingly
            return -1;
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
