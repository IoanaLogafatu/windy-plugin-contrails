interface LocationDetails {
  country: string;
  lang: string;
  lat: number;
  lon: number;
  name: string;
  nameValid: boolean;
  region: string;
}

export class Utility {
  static linearInterpolation(y1: number, y2: number, ratio: number): number {
    return Math.round(y1 + (y2 - y1) * ratio);
  }

  static locationDetails(locationObject: LocationDetails): string {
    // Destructure the needed properties from the object
    const { name, region, lat, lon } = locationObject;

    // Check if name and region are the same
    const nameRegion = name === region ? name : `${name}, ${region}`;

    // Format latitude and longitude to two decimal places
    const formattedLat = lat.toFixed(2);
    const formattedLon = lon.toFixed(2);

    // Concatenate the final string
    return `${nameRegion} (${formattedLat}, ${formattedLon})`;
  }

  static prediction(temperature: number, applemanCutoff: number, persistentCutoff: number, humidityIce: number): string {
    // First check if temperature is above the applemanCutoff, return an empty string if true
    if (temperature > applemanCutoff) {
      return '';
    }

    // Check for persistent contrails first since it has specific combined conditions
    if (humidityIce >= 100 && temperature <= persistentCutoff) {
      return "Persistent contrails";
    }

    // Next, determine the contrail type based on humidityIce
    if (humidityIce < 30) {
      return "Minimal contrails";
    } else if (humidityIce >= 30 && humidityIce < 85) {
      return "Contrails";
    } else { // humidityIce >= 85
      return "Long contrails";
    }
  }
}



