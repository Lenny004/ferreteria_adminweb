const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export type ApiRequestOptions = RequestInit & {
  token?: string;
};

export async function apiRequest<TResponse>(path: string, options: ApiRequestOptions = {}) {
  const { token, headers, ...requestOptions } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error("La API devolvio una respuesta no exitosa.");
  }

  return response.json() as Promise<TResponse>;
}
