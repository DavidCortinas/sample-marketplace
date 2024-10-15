import { fetchGenres } from "../api/genres";
import {
  FormattedResult,
  CategoryLabel,
  AdvancedParams,
  Query,
} from "../types/recommendations/types";
import { defaultAdvancedParams } from "../constants/advancedParams";
// import { useFetcher } from "@remix-run/react";

export type CategoryType = "track" | "artist" | "genre";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    images: { url: string }[];
  };
  href: string;
}

interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string }[];
}

export const searchSpotify = async (
  query: string,
  type: CategoryType,
  getAccessToken: () => Promise<string | null>
) => {
  const accessToken = await getAccessToken();
  if (type === "genre") {
    const genres = await fetchGenres();
    return genres.filter((genre: string) =>
      genre.toLowerCase().includes(query.toLowerCase())
    );
  } else {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=${type}&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    return type === "track" ? data.tracks.items : data.artists.items;
  }
};

export const formatResults = (
  results: (string | SpotifyTrack | SpotifyArtist)[],
  category: CategoryLabel
): FormattedResult[] => {
  if (category === "Genres") {
    return (results as string[]).map((genre) => ({
      id: genre,
      name: genre,
      imageUrl: "",
    }));
  } else if (category === "Songs") {
    return (results as SpotifyTrack[]).map((track) => ({
      id: track.id,
      name: track.name,
      imageUrl: track.album.images[2]?.url || "",
      artistName: track.artists[0]?.name,
    }));
  } else {
    return (results as SpotifyArtist[]).map((artist) => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images[2]?.url || "",
    }));
  }
};

export const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setInputValue: (value: string) => void,
  setSuggestions: (suggestions: FormattedResult[]) => void
) => {
  const value = e.target.value;
  setInputValue(value);

  if (value.length === 0) {
    setSuggestions([]);
  }
};

export const handleSelection = (
  item: FormattedResult,
  selections: FormattedResult[],
  setSelections: React.Dispatch<React.SetStateAction<FormattedResult[]>>,
  setInputValue: React.Dispatch<React.SetStateAction<string>>,
  setSuggestions: React.Dispatch<React.SetStateAction<FormattedResult[]>>
) => {
  const newItem = {
    ...item,
    type: item.artistName ? "track" : item.imageUrl ? "artist" : "genre",
  };

  setSelections((prev) => [...prev, newItem]);
  setInputValue("");
  setSuggestions([]);
};

export const handleRemoveSelection = (
  item: FormattedResult,
  selections: FormattedResult[],
  setSelections: (selections: FormattedResult[]) => void
) => {
  setSelections(selections.filter((selection) => selection.id !== item.id));
};

export const handleSubmit = async (
  e: React.FormEvent,
  selections: FormattedResult[],
  advancedParams: AdvancedParams,
  navigate: (
    path: string,
    options?: { state?: { recommendations: string[] }; replace?: boolean }
  ) => void
) => {
  e.preventDefault();

  // Prepare seed parameters
  const seedArtists = selections
    .filter((item) => !("artistName" in item) && item.imageUrl)
    .map((item) => item.id)
    .join(",");

  const seedTracks = selections
    .filter((item) => "artistName" in item)
    .map((item) => item.id)
    .join(",");

  const seedGenres = selections
    .filter((item) => !("artistName" in item) && !item.imageUrl)
    .map((item) => item.id)
    .join(",");

  // Prepare advanced parameters
  const advancedParamsFormatted = Object.entries(advancedParams).reduce(
    (acc, [key, value]) => {
      if (value.enabled) {
        if ("min" in value && value.min !== undefined)
          acc[`min_${key}`] = value.min;
        if ("max" in value && value.max !== undefined)
          acc[`max_${key}`] = value.max;
        acc[`target_${key}`] = value.target;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // Construct query string
  const queryParams = new URLSearchParams({
    seed_artists: seedArtists,
    seed_tracks: seedTracks,
    seed_genres: seedGenres,
    limit: "100", // You can make this dynamic if needed
    ...advancedParamsFormatted,
  });

  try {
    const response = await fetch(
      `http://localhost:8000/api/spotify/recommendations/?${queryParams.toString()}`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();

    // Navigate to the discover route with the results
    navigate(`/discover`, {
      state: { recommendations: data.track_uris },
      replace: true,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    // TODO: Handle error (e.g., display error message to user)
  }
};

export const handleCategoryChange = async (
  newCategory: CategoryLabel,
  setCategory: (category: CategoryLabel) => void,
  setInputValue: (value: string) => void,
  setSuggestions: (suggestions: FormattedResult[]) => void
) => {
  setCategory(newCategory);
  setInputValue("");
  setSuggestions([]);
  if (newCategory === "Genres") {
    try {
      const genres = await fetchGenres();
      setSuggestions(formatResults(genres, "Genres"));
    } catch (error) {
      console.error("Error fetching genres:", error);
      // Handle error (e.g., show error message to user)
    }
  }
};

export const handleParamToggle = (
  param: keyof AdvancedParams,
  setAdvancedParams: React.Dispatch<React.SetStateAction<AdvancedParams>>
) => {
  setAdvancedParams((prev) => ({
    ...prev,
    [param]: { ...prev[param], enabled: !prev[param].enabled },
  }));
};

export const handleParamChange = (
  param: keyof AdvancedParams,
  newValues: number[],
  advancedParams: AdvancedParams,
  setAdvancedParams: React.Dispatch<React.SetStateAction<AdvancedParams>>
) => {
  setAdvancedParams((prev) => {
    switch (param) {
      case "mode":
        return {
          ...prev,
          [param]: { ...prev[param], target: Math.round(newValues[0]) },
        };
      case "key":
      case "duration_ms":
      case "loudness":
      case "tempo":
      case "time_signature": {
        const [min, target, max] = newValues.map(Math.round);
        return {
          ...prev,
          [param]: {
            ...prev[param],
            min: Math.min(min, target, max),
            target: Math.max(min, Math.min(target, max)),
            max: Math.max(min, target, max),
          },
        };
      }
      default: {
        const [normalizedMin, normalizedTarget, normalizedMax] = newValues.map(
          (v) => denormalizeValue(param, v)
        );
        return {
          ...prev,
          [param]: {
            ...prev[param],
            min: Math.min(normalizedMin, normalizedTarget, normalizedMax),
            target: Math.max(
              normalizedMin,
              Math.min(normalizedTarget, normalizedMax)
            ),
            max: Math.max(normalizedMin, normalizedTarget, normalizedMax),
          },
        };
      }
    }
  });
};

export const parameterConfig = {
  acousticness: { min: 0, max: 100, step: 1 },
  danceability: { min: 0, max: 100, step: 1 },
  energy: { min: 0, max: 100, step: 1 },
  instrumentalness: { min: 0, max: 100, step: 1 },
  key: { min: 0, max: 11, step: 1 },
  duration_ms: { min: 30000, max: 3600000, step: 1000 },
  liveness: { min: 0, max: 100, step: 1 },
  loudness: { min: -60, max: 0, step: 0.1 },
  mode: { min: 0, max: 1, step: 1 },
  speechiness: { min: 0, max: 100, step: 1 },
  tempo: { min: 40, max: 220, step: 1 },
  time_signature: { min: 3, max: 7, step: 1 },
  valence: { min: 0, max: 100, step: 1 },
  popularity: { min: 0, max: 100, step: 1 },
};

export const getSliderValue = (
  param: keyof AdvancedParams,
  values: AdvancedParams[keyof AdvancedParams]
): number[] => {
  const config = parameterConfig[param];
  if (param === "mode") {
    return [values.target];
  }
  const typedValues = values as { min: number; target: number; max: number };
  return [
    typedValues.min ?? config.min,
    typedValues.target,
    typedValues.max ?? config.max,
  ];
};

export const normalizeValue = (
  param: keyof AdvancedParams,
  value: number
): number => {
  const { min, max } = parameterConfig[param];
  return ((value - min) / (max - min)) * 100;
};

export const denormalizeValue = (
  param: keyof AdvancedParams,
  normalizedValue: number
): number => {
  const { min, max } = parameterConfig[param];
  return min + (normalizedValue / 100) * (max - min);
};

export const formatParamValue = (
  param: keyof AdvancedParams,
  value: number
): string => {
  switch (param) {
    case "duration_ms":
      return formatTime(value / 1000);
    case "loudness":
      return `${value.toFixed(1)} dB`;
    case "key":
      return [
        "C",
        "C♯/D♭",
        "D",
        "D♯/E♭",
        "E",
        "F",
        "F♯/G♭",
        "G",
        "G♯/A♭",
        "A",
        "A♯/B♭",
        "B",
      ][Math.round(value)];
    case "mode":
      return value < 0.5 ? "Minor" : "Major";
    case "tempo":
      return `${value.toFixed(0)} BPM`;
    case "time_signature":
      return `${Math.round(value)}/4`;
    default:
      return value.toFixed(0);
  }
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const handleSaveQuery = async (
  selections: FormattedResult[],
  category: CategoryLabel,
  advancedParams: AdvancedParams,
  saveNewQuery: (
    selections: FormattedResult[],
    category: CategoryLabel,
    advancedParams: AdvancedParams,
    queryName: string
  ) => void
) => {
  const queryName = prompt("Enter a name for this query:");
  if (queryName) {
    try {
      console.log("Attempting to save query in handleSaveQuery...");
      saveNewQuery(selections, category, advancedParams, queryName);
      console.log("Query save initiated");
    } catch (error) {
      console.error("Error initiating query save:", error);
      alert(`Failed to initiate query save: ${error.message}`);
    }
  }
};

export const handleSelectQuery = (
  query: Query,
  setSelections: (selections: FormattedResult[]) => void,
  setCategory: (category: CategoryLabel) => void,
  setAdvancedParams: (params: AdvancedParams) => void,
  setSidebarMode: (mode: "search" | "playlists" | "queries") => void
) => {
  // Implement logic to populate the search form with the selected query
  setSelections(query.parameters.selections);
  setCategory(query.parameters.category);
  setAdvancedParams(query.parameters.advancedParams);
  // Set any other relevant parameters
  setSidebarMode("search");
};

export const handleSwitchToSearch = (
  setSidebarMode: (mode: "search" | "playlists" | "queries") => void
) => {
  setSidebarMode("search");
};

export const resetSearch = (
  setSelections: (selections: FormattedResult[]) => void,
  setCategory: (category: CategoryLabel) => void,
  setInputValue: (value: string) => void,
  setSuggestions: (suggestions: FormattedResult[]) => void,
  setAdvancedParams: React.Dispatch<React.SetStateAction<AdvancedParams>>
) => {
  setSelections([]);
  setCategory("Songs");
  setInputValue("");
  setSuggestions([]);
  setAdvancedParams(defaultAdvancedParams);
};
