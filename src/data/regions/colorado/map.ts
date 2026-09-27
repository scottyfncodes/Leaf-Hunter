import type { RegionMap } from '@/domain/types';

/**
 * Simplified Colorado map geometry for the built-in trailhead-style map.
 * Coordinates are [longitude, latitude] and intentionally approximate.
 */
export const COLORADO_MAP: RegionMap = {
  bounds: { west: -109.06, east: -102.04, south: 36.99, north: 41.01 },
  outline: [
    [-109.05, 41.0],
    [-102.05, 41.0],
    [-102.05, 37.0],
    [-109.05, 37.0],
  ],
  towns: [
    { name: 'Denver', latitude: 39.7392, longitude: -104.9903, major: true },
    { name: 'Boulder', latitude: 40.015, longitude: -105.2705 },
    { name: 'Fort Collins', latitude: 40.5853, longitude: -105.0844, major: true },
    { name: 'Colorado Springs', latitude: 38.8339, longitude: -104.8214, major: true },
    { name: 'Pueblo', latitude: 38.2544, longitude: -104.6091 },
    { name: 'Grand Junction', latitude: 39.0639, longitude: -108.5506, major: true },
    { name: 'Durango', latitude: 37.2753, longitude: -107.8801, major: true },
    { name: 'Aspen', latitude: 39.1911, longitude: -106.8175 },
    { name: 'Vail', latitude: 39.6403, longitude: -106.3742 },
    { name: 'Breckenridge', latitude: 39.4817, longitude: -106.0384 },
    { name: 'Steamboat Springs', latitude: 40.485, longitude: -106.8317 },
    { name: 'Estes Park', latitude: 40.3772, longitude: -105.5217 },
    { name: 'Telluride', latitude: 37.9375, longitude: -107.8123 },
    { name: 'Crested Butte', latitude: 38.8697, longitude: -106.9878 },
    { name: 'Salida', latitude: 38.5347, longitude: -105.9989 },
    { name: 'Buena Vista', latitude: 38.8422, longitude: -106.1311 },
    { name: 'Gunnison', latitude: 38.5458, longitude: -106.9253 },
    { name: 'Glenwood Springs', latitude: 39.5505, longitude: -107.3248 },
    { name: 'Leadville', latitude: 39.2508, longitude: -106.2925 },
    { name: 'Ouray', latitude: 38.0228, longitude: -107.6714 },
    { name: 'Nederland', latitude: 39.9614, longitude: -105.5108 },
    { name: 'Fairplay', latitude: 39.2247, longitude: -106.0017 },
    { name: 'Alamosa', latitude: 37.4695, longitude: -105.87 },
    { name: 'Montrose', latitude: 38.4783, longitude: -107.8762 },
    { name: 'Georgetown', latitude: 39.7061, longitude: -105.6975 },
    { name: 'Pagosa Springs', latitude: 37.2694, longitude: -107.0098 },
    { name: 'Walsenburg', latitude: 37.6242, longitude: -104.7803 },
    { name: 'Granby', latitude: 40.0861, longitude: -105.9394 },
    { name: 'Craig', latitude: 40.5153, longitude: -107.5464 },
    { name: 'Limon', latitude: 39.2639, longitude: -103.6922 },
    { name: 'Lamar', latitude: 38.0872, longitude: -102.6202 },
    { name: 'Sterling', latitude: 40.6255, longitude: -103.2077 },
  ],
  roads: [
    {
      name: 'I-70', kind: 'interstate',
      points: [[-109.05, 39.2], [-108.55, 39.07], [-108.0, 39.25], [-107.32, 39.55], [-106.83, 39.65], [-106.37, 39.64], [-106.1, 39.57], [-105.9, 39.68], [-105.7, 39.71], [-105.51, 39.74], [-105.2, 39.72], [-104.99, 39.74], [-104.6, 39.7], [-103.69, 39.26], [-102.05, 39.3]],
    },
    {
      name: 'I-25', kind: 'interstate',
      points: [[-104.9, 41.0], [-105.08, 40.58], [-104.98, 40.15], [-104.99, 39.74], [-104.87, 39.4], [-104.82, 38.83], [-104.61, 38.25], [-104.78, 37.62], [-104.5, 37.17], [-104.5, 37.0]],
    },
    {
      name: 'I-76', kind: 'interstate',
      points: [[-104.99, 39.8], [-104.6, 40.05], [-103.8, 40.25], [-103.2, 40.63], [-102.05, 41.0]],
    },
    {
      name: 'US 285', kind: 'highway',
      points: [[-105.0, 39.7], [-105.31, 39.52], [-105.47, 39.4], [-105.76, 39.41], [-106.0, 39.22], [-106.13, 38.84], [-106.08, 38.51], [-106.15, 38.1], [-105.87, 37.47], [-105.7, 37.0]],
    },
    {
      name: 'US 40', kind: 'highway',
      points: [[-105.68, 39.76], [-105.78, 39.8], [-105.76, 39.89], [-105.94, 40.09], [-106.39, 40.06], [-106.61, 40.38], [-106.83, 40.49], [-107.55, 40.52], [-109.05, 40.45]],
    },
    {
      name: 'US 50', kind: 'highway',
      points: [[-108.55, 39.07], [-107.88, 38.48], [-107.3, 38.45], [-106.93, 38.55], [-106.33, 38.5], [-106.0, 38.53], [-105.24, 38.44], [-104.61, 38.25], [-103.5, 38.1], [-102.05, 38.05]],
    },
    {
      name: 'US 550', kind: 'highway',
      points: [[-107.88, 38.48], [-107.76, 38.15], [-107.67, 38.02], [-107.71, 37.9], [-107.66, 37.81], [-107.69, 37.74], [-107.88, 37.27], [-107.9, 37.0]],
    },
    {
      name: 'CO 82', kind: 'highway',
      points: [[-107.32, 39.55], [-107.21, 39.4], [-106.82, 39.19], [-106.56, 39.11], [-106.38, 39.08], [-106.29, 39.25]],
    },
    {
      name: 'US 160', kind: 'highway',
      points: [[-109.05, 37.35], [-108.6, 37.35], [-107.88, 37.27], [-107.01, 37.27], [-106.8, 37.48], [-106.35, 37.68], [-105.87, 37.47], [-105.4, 37.6], [-104.78, 37.62]],
    },
    {
      name: 'CO 9', kind: 'highway',
      points: [[-106.1, 39.57], [-106.04, 39.48], [-106.0, 39.22]],
    },
    {
      name: 'Peak to Peak', kind: 'highway',
      points: [[-105.5, 39.8], [-105.51, 39.96], [-105.51, 40.07], [-105.53, 40.2], [-105.52, 40.38]],
    },
    {
      name: 'US 34', kind: 'highway',
      points: [[-105.08, 40.4], [-105.52, 40.38], [-105.69, 40.4], [-105.75, 40.41], [-105.82, 40.25], [-105.94, 40.09]],
    },
    {
      name: 'CO 133', kind: 'highway',
      points: [[-107.21, 39.4], [-107.29, 39.13], [-107.59, 38.87], [-107.88, 38.75]],
    },
    {
      name: 'Kebler Pass Rd', kind: 'highway',
      points: [[-106.93, 38.55], [-106.99, 38.87], [-107.1, 38.85], [-107.5, 38.9]],
    },
    {
      name: 'US 24', kind: 'highway',
      points: [[-104.82, 38.83], [-105.06, 38.99], [-105.5, 38.95], [-106.13, 38.84], [-106.29, 39.25], [-106.37, 39.64]],
    },
    {
      name: 'CO 14', kind: 'highway',
      points: [[-105.08, 40.58], [-105.5, 40.68], [-105.89, 40.52], [-106.28, 40.73]],
    },
    {
      name: 'Guanella Pass', kind: 'highway',
      points: [[-105.7, 39.71], [-105.71, 39.6], [-105.76, 39.41]],
    },
    {
      name: 'CO 62/145', kind: 'highway',
      points: [[-107.76, 38.15], [-107.89, 38.1], [-108.05, 38.03], [-107.81, 37.94], [-107.91, 37.81], [-108.03, 37.69], [-108.5, 37.35]],
    },
    {
      name: 'CO 65', kind: 'highway',
      points: [[-108.0, 39.25], [-108.05, 39.05], [-107.93, 38.9]],
    },
    {
      name: 'CO 12', kind: 'highway',
      points: [[-104.78, 37.62], [-105.0, 37.5], [-105.02, 37.35], [-104.9, 37.2], [-104.5, 37.17]],
    },
  ],
  ranges: [
    { name: 'Front Range', points: [[-105.9, 40.95], [-105.55, 40.95], [-105.45, 40.3], [-105.45, 39.7], [-105.35, 39.2], [-105.15, 38.7], [-105.4, 38.6], [-105.75, 39.1], [-105.95, 39.6], [-105.95, 40.3]] },
    { name: 'Park & Gore', points: [[-106.95, 40.95], [-106.55, 40.95], [-106.5, 40.4], [-106.2, 39.7], [-106.5, 39.55], [-106.8, 39.9], [-106.95, 40.4]] },
    { name: 'Sawatch', points: [[-106.6, 39.45], [-106.15, 39.35], [-106.05, 38.9], [-106.15, 38.3], [-106.55, 38.35], [-106.65, 38.9]] },
    { name: 'Elk Mountains', points: [[-107.35, 39.35], [-106.75, 39.3], [-106.7, 38.85], [-107.1, 38.7], [-107.4, 38.95]] },
    { name: 'San Juans', points: [[-108.15, 38.2], [-107.3, 38.15], [-106.6, 37.9], [-106.2, 37.55], [-106.3, 37.05], [-107.0, 37.05], [-107.95, 37.35], [-108.2, 37.75]] },
    { name: 'Sangre de Cristo', points: [[-105.75, 38.35], [-105.55, 38.35], [-105.2, 37.7], [-105.05, 37.05], [-105.35, 37.05], [-105.6, 37.6]] },
    { name: 'Flat Tops', points: [[-107.7, 40.25], [-107.1, 40.2], [-107.0, 39.85], [-107.4, 39.75], [-107.75, 39.95]] },
    { name: 'Grand Mesa', points: [[-108.35, 39.15], [-107.8, 39.2], [-107.7, 38.95], [-108.2, 38.85]] },
    { name: 'Spanish Peaks', points: [[-105.15, 37.45], [-104.85, 37.45], [-104.85, 37.25], [-105.15, 37.25]] },
  ],
};
