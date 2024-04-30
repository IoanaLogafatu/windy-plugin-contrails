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
}



