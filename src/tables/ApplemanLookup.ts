/**
 * Extract of the Appleman data
 * https://www.globe.gov/web/s-cool/home/observation-and-reporting/contrails/appleman-chart-teacher
 * 
 * Relative Humidities 0% 30% 60% 90% 100%
 * 
 */
export const ApplemanLookup: { [key: string]: number[] } = {
    30.0: [-69.61, -68.67, -67.36, -64.93, -61.74],
    50.0: [-65.53, -64.54, -63.17, -60.64, -57.15],
    100.0: [-59.68, -58.63, -57.17, -54.47, -50.92],
    115.0: [-58.45, -57.39, -55.91, -53.17, -49.61],
    130.0: [-57.36, -56.29, -54.79, -52.02, -48.43],
    150.0: [-56.07, -54.99, -53.47, -50.66, -47.01],
    175.0: [-54.67, -53.56, -52.02, -49.18, -45.42],
    200.0: [-53.43, -52.31, -50.76, -47.87, -44.12],
    250.0: [-51.33, -50.19, -48.60, -45.65, -41.80],
    300.0: [-49.58, -48.42, -46.80, -43.79, -39.87],
    350.0: [-48.07, -46.89, -45.25, -42.20, -38.23],
    400.0: [-46.75, -45.55, -43.89, -40.80, -36.77],
    450.0: [-45.57, -44.36, -42.67, -39.54, -35.46],
    500.0: [-44.50, -43.27, -41.57, -38.41, -34.28],
    600.0: [-42.62, -41.37, -39.63, -36.41, -32.18],
    700.0: [-41.00, -39.73, -37.97, -34.69, -30.40],
    800.0: [-39.58, -38.29, -36.50, -33.18, -28.84],
    900.0: [-38.30, -37.00, -35.19, -31.82, -27.43],
    1000.0: [-37.15, -35.84, -34.00, -30.60, -26.15]
};
