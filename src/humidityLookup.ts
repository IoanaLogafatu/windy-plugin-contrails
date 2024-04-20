// humidityLookup.ts

/**
 * Lookup table for relative humidity with respect to ice
 * Reference: https://www.metabunk.org/threads/calculator-for-rhi-and-contrail-persistence-criteria.7196/
 */
export const humidityLookupTable: { [key: string]: number } = {
    '-30': 75.0,
    '-32': 73.3,
    '-34': 71.8,
    '-36': 70.3,
    '-38': 68.9,
    '-40': 67.5,
    '-42': 66.2,
    '-44': 64.9,
    '-46': 63.7,
    '-48': 62.5,
    '-50': 61.3,
    '-52': 60.3,
    '-54': 59.2,
    '-56': 58.2,
    '-58': 57.2,
    '-60': 56.2,
    '-62': 55.3,
    '-64': 54.4,
    '-66': 53.6,
    '-68': 52.7,
    '-70': 51.9,
};
