export interface Sounding {
    pressure: number;       // Pressure in hPa
    height: number;         // Height in feet
    temperature: number;    // Temperature in celsius
    dewpoint: number;       // Dewpoint
    humidityWater: number;  // Relative humidity with respect to water (RHw)
    humidityIce: number;    // Relative humidity with respect to ice (THi)
    appleman0: number,      // Appleman temp at 0% RH
    appleman100: number,    // Appleman temp at 100% RH
    applemanTemp: number,   // Appleman temp at actual RH
    persistent: number,     // Maximum temp for persistence.
    human: string,          // Human readable prediction
    ditto: boolean          // Human readable repeated
}