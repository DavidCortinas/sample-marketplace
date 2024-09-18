import { API_BASE_URL } from '../config';
import { Query } from '../types/recommendations/types';

export async function saveQuery(query: Query): Promise<Query> {
  const response = await fetch(`${API_BASE_URL}/api/spotify/queries/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    throw new Error('Failed to save query');
  }

  return response.json();
}
