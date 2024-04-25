import { ApplemanLookup } from '.././tables/ApplemanLookup';
import { Utility } from '.././classes/Utility.class';
import { PersistentMaximumLookup } from '.././tables/PersistentMaximumLookup';

export class Appleman {

  private static readonly HumidityLevels: number[] = [0, 30, 60, 90, 100];
  private pressure: number;
  private levelArray: number[];
  private validData: boolean;

  constructor(pressure: number) {
    this.pressure = pressure;
    this.retrieveAppleman();
  }

  get isValid() {
    return this.validData;
  }

  get low() {
    return this.levelArray[0];
  }

  get high() {
    return this.levelArray[4];
  }


  private retrieveAppleman(): void {
    const keys = Object.keys(ApplemanLookup).map(Number).sort((a, b) => a - b);
    const lowerKeyIndex = keys.findIndex(key => key > this.pressure) - 1;

    if (lowerKeyIndex === -1 || lowerKeyIndex === keys.length - 1) {
      this.validData = false;
      this.levelArray = [0, 0, 0, 0, 0];
    }
    else {
      this.validData = true;

      const lowerKey = keys[lowerKeyIndex];
      const higherKey = keys[lowerKeyIndex + 1];
      const ratio = (this.pressure - lowerKey) / (higherKey - lowerKey);

      const lowerData = ApplemanLookup[lowerKey];
      const higherData = ApplemanLookup[higherKey];
      const interpolatedData = lowerData.map((value, index) =>
        Utility.linearInterpolation(value, higherData[index], ratio)
      );

      this.levelArray = interpolatedData;
    }
  }

  cutOffTemp(rh: number): number {
    if (rh <= 0) return this.levelArray[0];
    if (rh >= 100) return this.levelArray[4];

    // Find the indices for the closest humidity levels
    const upperIndex = Appleman.HumidityLevels.findIndex(level => level >= rh);
    const lowerIndex = upperIndex - 1;

    // Calculate interpolation ratio
    const lowerRH = Appleman.HumidityLevels[lowerIndex];
    const upperRH = Appleman.HumidityLevels[upperIndex];
    const ratio = (rh - lowerRH) / (upperRH - lowerRH);

    // Interpolate between the corresponding data points
    const interpolatedValue = Utility.linearInterpolation(this.levelArray[lowerIndex], this.levelArray[upperIndex], ratio);

    return interpolatedValue;
  }

  get persistentCutoff(): number {
    const pressures = Object.keys(PersistentMaximumLookup).map(Number).sort((a, b) => a - b);
    const lowerBoundIndex = pressures.findIndex(p => p >= this.pressure) - 1;

    if (lowerBoundIndex === -1) {  // pressure is below the lowest key
        return PersistentMaximumLookup[pressures[0]];
    } else if (lowerBoundIndex === pressures.length - 1 || pressures[lowerBoundIndex + 1] === undefined) {  // pressure is above the highest key or matches the highest key
        return PersistentMaximumLookup[pressures[lowerBoundIndex]];
    }

    // Interpolation between two closest pressures
    const lowerPressure = pressures[lowerBoundIndex];
    const upperPressure = pressures[lowerBoundIndex + 1];
    const ratio = (this.pressure - lowerPressure) / (upperPressure - lowerPressure);
    return Utility.linearInterpolation(PersistentMaximumLookup[lowerPressure], PersistentMaximumLookup[upperPressure], ratio);
}

}