export * from './traverse-query';
export * from './expand-nested-array-exps';

export type Location = [number, number] | { lon: number; lat: number };
export type LocationDistanceUnit = 'miles' | 'mi' | 'kilometers' | 'km';
export type LocationDistance = number | `${number}${LocationDistanceUnit}`;

export const isObj = (obj: unknown): obj is Record<string, any> => !!obj && typeof obj === 'object' && !Array.isArray(obj);
export const locationToLatLonTuple = (location: unknown): [number, number] => {
    const [lon, lat] = Array.isArray(location) ? location : isObj(location) ? [location.lon, location.lat] : [];

    if (typeof lon !== 'number' || typeof lat !== 'number') {
        console.log('location', location);
        throw new Error('Location must be specified as tuple [lon, lat] or a lon/lat object.');
    }

    return [lon, lat];
};

export const earthRadiusInMiles = 3958.8;

export const toRadians = (deg: number) => deg * (Math.PI / 180);

export const distanceToMiles = (distance: LocationDistance): number => {
    if (typeof distance === 'number') {
        return distance * earthRadiusInMiles;
    }

    const [match, distanceSansUnit = '', unit] =
        String(distance)
            .trim()
            .match(/^([\d.]+)\s*(mi|miles?|km|kilometers?)?$/i) ?? [];

    const dist = parseFloat(distanceSansUnit);
    if (!match || isNaN(dist)) throw new Error('Invalid distance.');

    return unit?.startsWith('mi') ? dist : dist * 0.621371;
};
