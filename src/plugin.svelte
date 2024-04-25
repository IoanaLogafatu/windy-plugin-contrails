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
                    <th>Pressure<br />Height</th>
                    <th>Dew<br />Temp</th>
                    <th>RHw<br />RHi</th>
                    <th>Apple<br />Range</th>
                    <th>i100%<br />Apple</th>
                    <th>Pers</th>
                </tr>
            </thead>
            <tbody>
                {#each flightLevels as { height, humidityWater, temperature, humidityIce, dewpoint, ice100, pressure, appleman0, appleman100, applemanTemp, persistent }}
                    <tr>
                        <td>{pressure}&nbsp;hPa<br />{height}&nbsp;ft</td>
                        <td>{dewpoint}&nbsp;C<br />{temperature}&nbsp;C</td>
                        <td>{humidityWater}&nbsp;%<br />{humidityIce}&nbsp;%</td>
                        <td>{appleman0}&nbsp;C<br />{appleman100}&nbsp;C</td>
                        <td>{ice100}&nbsp;%<br />{applemanTemp}&nbsp;C</td>
                        <td>{persistent}&nbsp;C</td>
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
    import { HumidityWaterIce100Lookup } from './tables/HumidtyWaterIce100Lookup';
    import { Sounding } from './sounding.interface';
    import {
        MeteogramDataPayload,
        MeteogramDataHash,
    } from '@windycom/plugin-devtools/types/interfaces';
    import { Utility } from './classes/Utility.class';
    import { Appleman } from './classes/Appleman.class';
    const { title } = config;

    let rawdata: Sounding[] = [];
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
        return windyFetch.getMeteogramForecastData('ukv', { lat, lon });
    };

    /**
     * Updates the weather statistics by processing the data retrieved
     * This function parses and converts meteorological data from Kelvin to Celsius for temperature and dewpoint,
     * formats humidity and calculates the average relative humidity with respect to ice using the current temperature.
     * It also converts height from metres to feet.
     *
     * @param any weatherData - The raw weather data object retrieved from the weather API.
     */
    const updateWeatherStats = (weatherData: MeteogramDataPayload) => {
        rawdata = []; // Array to store data for each layer

        // Loop over all properties in weatherData.data.data
        for (const key in weatherData.data) {
            if (key.startsWith('gh-')) {
                const suffix = key.split('gh-')[1]; // Get the suffix to match other data
                const tempKey = `temp-${suffix}`;
                const dewpointKey = `dewpoint-${suffix}`;
                const humidityKey = `rh-${suffix}`;

                const pressure = +suffix.slice(0, -1);
                const heightInMeters = +weatherData.data[key as keyof MeteogramDataHash][0];
                const height = +(heightInMeters * 3.28084).toFixed(0); // Convert to feet
                const temperature = +(
                    weatherData.data[tempKey as keyof MeteogramDataHash][0] - 273.15
                ).toFixed(0); // Convert Kelvin to Celsius
                const dewpoint = +(
                    weatherData.data[dewpointKey as keyof MeteogramDataHash][0] - 273.15
                ).toFixed(0);
                const humidityWater =
                    +weatherData.data[humidityKey as keyof MeteogramDataHash][0].toFixed(0);
                const humidityIce = getRHi(humidityWater, temperature);
                const ice100 = getAverageRHw(temperature);
                const appleman0 = 0;
                const appleman100 = 0;
                const applemanTemp = 0;
                const persistent = 0;

                rawdata.push({
                    pressure,
                    height,
                    temperature,
                    dewpoint,
                    humidityWater,
                    humidityIce,
                    ice100,
                    appleman0,
                    appleman100,
                    applemanTemp,
                    persistent,
                });
            }
        }
        // Sorting the array by height in descending order
        rawdata.sort((a, b) => b.height - a.height);

        console.log('Processed Layers Data:', rawdata);
        flightLevels = stratify(rawdata);
        console.log('Stratified Data:', flightLevels);
    };

    /**
     * Rough calculation (~1%) of the RHi at a given temperature
     * @param RHw
     * @param temperature
     */
    function getRHi(RHw: number, temperature: number): number {
        const RHi = RHw * (0.89 - 0.0148 * temperature);
        return Math.round(RHi);
    }

    /**
     * Lookup up the RHw required for 100% RHi at a given temperature
     * This function is based on a chart with an increment of 2C
     * If the required value is between 2 points, an average is taken
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
            HumidityWaterIce100Lookup[lowerBoundKey] !== undefined &&
            HumidityWaterIce100Lookup[upperBoundKey] !== undefined
        ) {
            // Calculate the average of the two bounding values
            const averageRHw =
                (HumidityWaterIce100Lookup[lowerBoundKey] +
                    HumidityWaterIce100Lookup[upperBoundKey]) /
                2;
            return +averageRHw.toFixed(1); // Format to one decimal place
        } else {
            // If one or both bounds don't exist, handle accordingly
            return -1;
        }
    }

    function stratify(data: Sounding[]) {
        const result = [];
        // Define the range of heights for interpolation
        const startHeight = Math.floor(data[0].height / 1000) * 1000; // Highest point, rounded down to nearest 1000
        let endHeight = Math.floor(data[data.length - 1].height / 1000) * 1000; // Lowest point, rounded down to nearest 1000
        const step = 1000;

        if (endHeight < 20000) {
            endHeight = 20000;
        }

        console.log(startHeight, endHeight);
        for (let height = startHeight; height >= endHeight; height -= step) {
            // Find the nearest data points around the current height
            const upperBoundIndex = data.findIndex(d => d.height <= height);
            if (upperBoundIndex === -1) {
                // All points are above the height; unlikely, given the logic
                result.push({ ...data[data.length - 1], height });
            } else if (upperBoundIndex === 0 || data[upperBoundIndex].height === height) {
                // The exact match or the first element matches as the lowest point
                result.push({ ...data[upperBoundIndex], height });
            } else {
                // Normal case, interpolate between the bounds
                const upper = data[upperBoundIndex];
                const lower = data[upperBoundIndex - 1];
                result.push(interpolate(lower, upper, height));
            }
        }

        return result;
    }

    function interpolate(lower: Sounding, upper: Sounding, targetHeight: number): Sounding {
        const ratio = (targetHeight - upper.height) / (lower.height - upper.height);
        const pressure = Utility.linearInterpolation(upper.pressure, lower.pressure, ratio);
        const appleman = new Appleman(pressure);
        const humidity = Utility.linearInterpolation(
            upper.humidityWater,
            lower.humidityWater,
            ratio,
        );

        const interpolated: Sounding = {
            height: targetHeight,
            pressure: pressure,
            temperature: Utility.linearInterpolation(upper.temperature, lower.temperature, ratio),
            dewpoint: Utility.linearInterpolation(upper.dewpoint, lower.dewpoint, ratio),
            humidityWater: humidity,
            humidityIce: Utility.linearInterpolation(upper.humidityIce, lower.humidityIce, ratio),
            ice100: Utility.linearInterpolation(upper.ice100, lower.ice100, ratio),
            appleman0: appleman.low,
            appleman100: appleman.high,
            applemanTemp: appleman.cutOffTemp(humidity),
            persistent: appleman.persistentCutoff,
        };

        return interpolated;
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
        table {
            width: 100%; // Ensures the table takes the full width of its container
            tr {
                th,
                td {
                    padding-top: 10px; // Adds padding to the top of each cell
                    padding-bottom: 10px; // Adds padding to the bottom of each cell
                }
            }
        }
    }
</style>
