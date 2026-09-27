import type { Region } from '@/domain/types';
import { COLORADO_LOCATIONS } from './locations';
import { COLORADO_MAP } from './map';

export const COLORADO: Region = {
  id: 'colorado',
  name: 'Colorado',
  shortName: 'CO',
  season: {
    preseasonStart: '08-15',
    seasonStart: '09-05',
    seasonEnd: '10-31',
  },
  defaultStart: { id: 'denver', name: 'Denver', latitude: 39.7392, longitude: -104.9903 },
  startPoints: [
    { id: 'denver', name: 'Denver', latitude: 39.7392, longitude: -104.9903 },
    { id: 'boulder', name: 'Boulder', latitude: 40.015, longitude: -105.2705 },
    { id: 'fort-collins', name: 'Fort Collins', latitude: 40.5853, longitude: -105.0844 },
    { id: 'colorado-springs', name: 'Colorado Springs', latitude: 38.8339, longitude: -104.8214 },
    { id: 'grand-junction', name: 'Grand Junction', latitude: 39.0639, longitude: -108.5506 },
    { id: 'durango', name: 'Durango', latitude: 37.2753, longitude: -107.8801 },
    { id: 'vail', name: 'Vail', latitude: 39.6403, longitude: -106.3742 },
    { id: 'aspen', name: 'Aspen', latitude: 39.1911, longitude: -106.8175 },
  ],
  locations: COLORADO_LOCATIONS,
  map: COLORADO_MAP,
};
