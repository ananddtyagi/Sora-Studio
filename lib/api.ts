export async function apiCall(
  url: string,
  options: RequestInit = {},
  apiKey: string | null
): Promise<Response> {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'x-api-key': apiKey,
    },
  });
}
