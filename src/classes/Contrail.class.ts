import store from '@windy/store';
import reverseName from '@windy/reverseName';
import { Utility } from './Utility.class';
import windyFetch from '@windy/fetch';
import { Sounding } from './sounding.interface';
import { HumidityWaterIce100Lookup } from '../tables/HumidtyWaterIce100Lookup';
import { Appleman } from '../classes/Appleman.class';
import {
    MeteogramDataPayload,
    MeteogramDataHash,
} from '@windycom/plugin-devtools/types/interfaces';


export class Contrail {

    private _rawdata: Sounding[] = [];
    private _flightLevels: Sounding[] = [];
    private _clickLocation = '';

    get flightLevels() {
        return this._flightLevels;
    }

    get clickLocation() {
        return this._clickLocation;
    }

    async handleEvent(ev: { lat: any; lon: any; }) {
        try {
            const product = await store.get('product'); // Retrieve product asynchronously
            const locationObject = await reverseName.get({ lat: ev.lat, lon: ev.lon });
            this._clickLocation = Utility.locationDetails(locationObject);
            const weatherData = await this.fetchData(ev.lat, ev.lon, product); // Pass the product to fetchData
            this.updateWeatherStats(weatherData.data);
        } catch (error) {
            console.error('* * * An error occurred:', error);
        }
    }

    fetchData(lat: any, lon: any, product: any) {
        return windyFetch.getMeteogramForecastData(product, { lat, lon }); // Use the product passed to the function
    }

    updateWeatherStats = (weatherData: MeteogramDataPayload) => {
        this._rawdata = []; // Array to store data for each layer

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
                const humidityIce = this.getRHi(humidityWater, temperature);
                const ice100 = this.getAverageRHw(temperature);
                const appleman0 = 0;
                const appleman100 = 0;
                const applemanTemp = 0;
                const persistent = 0;
                const human = '';

                this._rawdata.push({
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
                    human,
                });
            }
        }
        // Sorting the array by height in descending order
        this._rawdata.sort((a, b) => b.height - a.height);

        console.log('Processed Layers Data:', this._rawdata);
        this._flightLevels = this.stratify(this._rawdata);
        console.log('Stratified Data:', this.flightLevels);
    };

    getRHi(RHw: number, temperature: number): number {
        const RHi = RHw * (0.89 - 0.0148 * temperature);
        return Math.round(RHi);
    }

    getAverageRHw(temp: number): number {
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

    stratify(data: Sounding[]) {
        const result = [];
        // Define the range of heights for interpolation
        const startHeight = Math.floor(data[0].height / 1000) * 1000; // Highest point, rounded down to nearest 1000
        let endHeight = Math.floor(data[data.length - 1].height / 1000) * 1000; // Lowest point, rounded down to nearest 1000
        const step = 1000;

        if (endHeight < 20000) {
            endHeight = 20000;
        }

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
                result.push(this.interpolate(lower, upper, height));
            }
        }

        return result;
    }

    interpolate(lower: Sounding, upper: Sounding, targetHeight: number): Sounding {
        const ratio = (targetHeight - upper.height) / (lower.height - upper.height);
        const pressure = Utility.linearInterpolation(upper.pressure, lower.pressure, ratio);
        const appleman = new Appleman(pressure);
        const humidityWater = Utility.linearInterpolation(
            upper.humidityWater,
            lower.humidityWater,
            ratio,
        );
        const applemanCutoff = appleman.cutOffTemp(humidityWater);
        const humidityIce = Utility.linearInterpolation(
            upper.humidityIce,
            lower.humidityIce,
            ratio,
        );
        const temperature = Utility.linearInterpolation(
            upper.temperature,
            lower.temperature,
            ratio,
        );

        const interpolated: Sounding = {
            height: targetHeight,
            pressure: pressure,
            temperature: temperature,
            dewpoint: Utility.linearInterpolation(upper.dewpoint, lower.dewpoint, ratio),
            humidityWater: humidityWater,
            humidityIce: Utility.linearInterpolation(upper.humidityIce, lower.humidityIce, ratio),
            ice100: Utility.linearInterpolation(upper.ice100, lower.ice100, ratio),
            appleman0: appleman.low,
            appleman100: appleman.high,
            applemanTemp: applemanCutoff,
            persistent: appleman.persistentCutoff,
            human: Utility.prediction(
                temperature,
                applemanCutoff,
                appleman.persistentCutoff,
                humidityIce,
            ),
        };

        return interpolated;
    }
}
