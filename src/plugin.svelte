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

    <h4>{clickLocation}</h4>
    <div class="weather-stats">
        <table>
            <tbody>
                {#each flightLevels as { height, temperature, applemanTemp, human }}
                    {#if temperature <= applemanTemp}
                        <tr class="black-text">
                            <td>{height}&nbsp;ft</td>
                            <td>{human}</td>
                        </tr>
                    {/if}
                {/each}
            </tbody>
        </table>
    </div>

    <hr />
    <h4>Detailed analysis</h4>
    <div class="weather-stats">
        <table>
            <thead>
                <tr>
                    <th>Height</th>
                    <th>Temp</th>
                    <th>RHw</th>
                    <th>RHi</th>
                    <th>Pers</th>
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
                        <td>{height}&nbsp;ft</td>
                        <td>{temperature}&nbsp;C</td>
                        <td>{humidityWater}&nbsp;%</td>
                        <td>{humidityIce}&nbsp;%</td>
                        <td>
                            {humidityIce >= 100 && temperature <= persistent ? '✓' : ' '}
                        </td>
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
    import { Contrail } from './classes/Contrail.class';

    let flightLevels: any[] = [];
    let clickLocation = '';

    const { title } = config;
    const contrail = new Contrail();

    export const onopen = async (_params: { lat: any; lon: any; }) => {
        if (!_params) {
            return; // Ignore null _params and do not execute further
        }

        await contrail.handleEvent(_params); // Wait for handleEvent to complete
        clickLocation = contrail.clickLocation;
        flightLevels = contrail.flightLevels;
    };

    onMount(() => {
        singleclick.on('windy-plugin-contrails', async ev => {
            await contrail.handleEvent(ev); // Wait for handleEvent to complete
            clickLocation = contrail.clickLocation;
            flightLevels = contrail.flightLevels;
        });
    });

    onDestroy(() => {
        // Your plugin was destroyed
    });
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
</style>
