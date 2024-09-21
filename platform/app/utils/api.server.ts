const BASE_URL = "http://localhost:8000/api";

export async function serverFetch(url: string, options: RequestInit = {}) {
    const fullUrl = `${BASE_URL}${url}`;

  console.log("Server fetch request:", {
    url: fullUrl,
    method: options.method,
    headers: options.headers,
  });

  const response = await fetch(fullUrl, options);

  console.log("Server fetch response:", {
    status: response.status,
    headers: response.headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Server fetch error body:", errorBody);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
}

export function createAuthenticatedServerFetch(token: string) {
  return (endpoint: string, options: RequestInit = {}) => {
    return serverFetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  };
}
