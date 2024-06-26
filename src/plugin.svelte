<div class="plugin__mobile-header">
    {title}
</div>
<section class="plugin__content">
    <div
        class="plugin__title plugin__title--chevron-back"
        on:click={() => bcast.emit('rqstOpen', 'menu')}
    >
        {title} <span style="font-size: 0.5em;">v{version}</span>
    </div>

    {#if !ready}
        <h4>Click on map to generate an analysis</h4>
    {:else}
        <h4>{clickLocation}</h4>
        <h4>{forecastDate}</h4>
        {#if filteredFlightLevels.length === 0}
            <h3>No contrails predicted</h3>
        {:else}
            <div class="weather-stats">
                <table>
                    <tbody>
                        {#each filteredFlightLevels as { height, temperature, applemanTemp, human, ditto }}
                            {#if temperature <= applemanTemp}
                                <tr class="black-text">
                                    <td>{height}&nbsp;ft</td>
                                    <td>
                                        {#if ditto}
                                            <span class="ditto">''</span>
                                        {:else}
                                            {human}
                                        {/if}
                                    </td>
                                </tr>
                            {/if}
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
        <hr />
        <h4>Detailed analysis - will contrails form?</h4>
        <div class="weather-stats">
            <table>
                <thead>
                    <tr>
                        <th>ft</th>
                        <th>hPa</th>
                        <th>°C</th>
                        <th>RHw</th>
                        <th colspan="3">Appleman</th>
                    </tr>
                </thead>
                <tbody>
                    {#each flightLevels as { height, pressure, temperature, humidityWater, appleman0, appleman100, applemanTemp }}
                        <tr
                            class:green-text={temperature < appleman0}
                            class:blue-text={temperature >= appleman0 &&
                                temperature < appleman100 &&
                                temperature <= applemanTemp}
                            class:yellow-text={temperature >= appleman0 &&
                                temperature < appleman100 &&
                                temperature > applemanTemp}
                            class:red-text={temperature >= appleman100}
                        >
                            <td>{height}</td>
                            <td>{pressure}</td>
                            <td>{temperature}</td>
                            <td>{humidityWater}</td>
                            <td>{appleman0}</td>
                            <td>{applemanTemp}</td>
                            <td>{appleman100}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        <hr />
        <h4>Detailed analysis - Contrail persistence</h4>
        <div class="weather-stats">
            <table>
                <thead>
                    <tr>
                        <th>ft</th>
                        <th>°C</th>
                        <th>RHw</th>
                        <th>RHi</th>
                        <th>Max °C</th>
                        <th>&nbsp;</th>
                    </tr>
                </thead>
                <tbody>
                    {#each flightLevels as { height, temperature, humidityWater, humidityIce, appleman0, appleman100, applemanTemp, persistent }}
                        <tr
                            class:green-text={temperature < appleman0}
                            class:blue-text={temperature >= appleman0 &&
                                temperature < appleman100 &&
                                temperature <= applemanTemp}
                            class:yellow-text={temperature >= appleman0 &&
                                temperature < appleman100 &&
                                temperature > applemanTemp}
                            class:red-text={temperature >= appleman100}
                        >
                            <td>{height}</td>
                            <td>{temperature}</td>
                            <td>{humidityWater}</td>
                            <td>{humidityIce}</td>
                            <td>{persistent}</td>
                            <td>
                                {humidityIce >= 100 && temperature <= persistent ? '✓' : ' '}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
    <hr />
    <ul class="nav-links">
        <li>
            <a href="https://github.com/IoanaLogafatu/windy-plugin-contrails/wiki">User guide</a>
        </li>
        <li>
            <a href="https://github.com/IoanaLogafatu/windy-plugin-contrails/issues"
                >Report an issue</a
            >
        </li>
        <li>
            <a href="https://github.com/IoanaLogafatu/windy-plugin-contrails/discussions"
                >Ask a question or make a suggestion</a
            >
        </li>
    </ul>
</section>

<script lang="ts">
    import bcast from '@windy/broadcast';
    import { onDestroy, onMount } from 'svelte';
    import config from './pluginConfig';
    import { singleclick } from '@windy/singleclick';
    import { Contrail } from './classes/Contrail.class';

    let ready = false;
    let flightLevels: any[] = [];
    let clickLocation = '';
    let filteredFlightLevels: any[] = [];
    let forecastDate = '';

    const { title } = config;
    const { version } = config;
    const contrail = new Contrail();

    export const onopen = async (_params: { lat: any; lon: any }) => {
        if (!_params) {
            return; // Ignore null _params and do not execute further
        }

        await contrail.handleEvent(_params); // Wait for handleEvent to complete
        assignAnalysis(contrail);
    };

    onMount(() => {
        singleclick.on('windy-plugin-contrails', async ev => {
            await contrail.handleEvent(ev); // Wait for handleEvent to complete
            assignAnalysis(contrail);
        });
    });

    onDestroy(() => {
        // Your plugin was destroyed
    });

    function assignAnalysis(contrail: Contrail) {
        clickLocation = contrail.clickLocation;
        flightLevels = contrail.flightLevels;
        filteredFlightLevels = flightLevels.filter(
            level => level.temperature <= level.applemanTemp,
        );
        forecastDate = 'Forecast for ' + contrail.forecastDate + ' using model ' + contrail.model;
        ready = true;
    }
</script>

<style lang="less">
    .weather-stats {
        display: flex;
        flex-direction: column;
        padding: 10px;
        background-color: ivory;
        th {
            color: black; /* Sets the text color of headers to black */
            background-color: #f0f0f0; /* Optional: sets a light gray background for better contrast */
        }
        label {
            font-weight: bold;
        }
        .stat {
            margin-bottom: 5px;
        }
        table {
            width: 100%; // Ensures the table takes the full width of its container
        }
        .green-text {
            color: green;
        } /* Dark green */
        .yellow-text {
            color: #daa520;
        }
        .red-text {
            color: red;
        } /* Firebrick red */
        .blue-text {
            color: blue;
        }
        .black-text {
            color: black;
        }
    }

    .nav-links {
        list-style-type: none;
        padding: 0;
        margin: 0;
        background-color: #f8f9fa;
        padding: 10px;
        border-radius: 5px;
    }

    .nav-links li {
        margin-bottom: 10px;
    }

    .nav-links li:last-child {
        margin-bottom: 0;
    }

    .nav-links a {
        text-decoration: none;
        color: #007bff;
        font-weight: bold;
    }

    .nav-links a:hover {
        text-decoration: underline;
    }
</style>
