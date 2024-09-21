export type CategoryLabel = "Songs" | "Artists" | "Genres";

export interface AdvancedParams {
  acousticness: AudioFeatureParam;
  danceability: AudioFeatureParam;
  energy: AudioFeatureParam;
  instrumentalness: AudioFeatureParam;
  key: KeyParam;
  duration_ms: DurationParam;
  liveness: AudioFeatureParam;
  loudness: LoudnessParam;
  mode: ModeParam;
  popularity: PopularityParam;
  speechiness: AudioFeatureParam;
  tempo: TempoParam;
  time_signature: TimeSignatureParam;
  valence: AudioFeatureParam;
}

interface AudioFeatureParam {
  enabled: boolean;
  min: number;
  target: number;
  max: number;
}

interface KeyParam {
  enabled: boolean;
  min: number;
  target: number;
  max: number;
}

interface DurationParam {
  enabled: boolean;
  min: number;
  target: number;
  max: number;
}

interface LoudnessParam {
  enabled: boolean;
  min: number;
  target: number;
  max: number;
}

interface ModeParam {
  enabled: boolean;
  target: number;
}

interface PopularityParam {
  enabled: boolean;
  min: number;
  target: number;
  max: number;
}

interface TempoParam {
  enabled: boolean;
  min: number;
  target: number;
  max: number;
}

interface TimeSignatureParam {
  enabled: boolean;
  min: number;
  target: number;
  max: number;
}

export interface FormattedResult {
  id: string;
  name: string;
  imageUrl?: string;
  artistName?: string;
}

export interface Query {
  id: string;
  name: string;
  parameters: {
    selections: FormattedResult[];
    advancedParams: AdvancedParams;
    category: CategoryLabel;
  };
}
