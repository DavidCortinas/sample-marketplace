import { AdvancedParams } from '../types/recommendations/types';

export const defaultAdvancedParams: AdvancedParams = {
  acousticness: { enabled: false, min: 0, max: 100, target: 50 },
  danceability: { enabled: false, min: 0, max: 100, target: 50 },
  energy: { enabled: false, min: 0, max: 100, target: 50 },
  instrumentalness: { enabled: false, min: 0, max: 100, target: 50 },
  key: { enabled: false, min: 0, max: 11, target: 5 },
  duration_ms: { enabled: false, min: 30000, max: 3600000, target: 210000 },
  liveness: { enabled: false, min: 0, max: 100, target: 50 },
  loudness: { enabled: false, min: -60, max: 0, target: -30 },
  mode: { enabled: false, target: 0.5 },
  speechiness: { enabled: false, min: 0, max: 100, target: 50 },
  tempo: { enabled: false, min: 40, max: 220, target: 120 },
  time_signature: { enabled: false, min: 3, max: 7, target: 4 },
  valence: { enabled: false, min: 0, max: 100, target: 50 },
  popularity: { enabled: false, min: 0, max: 100, target: 50 },
};
