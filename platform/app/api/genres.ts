import { API_BASE_URL } from "../config";

export async function fetchGenres(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/genres/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching genre seeds:", error);
    return []; // Return an empty array in case of error
  }
}
