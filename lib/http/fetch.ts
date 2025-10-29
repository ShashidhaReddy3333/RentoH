export async function fetchJson<T>(url: RequestInfo | URL, init?: RequestInit, tries = 2): Promise<T> {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const response = await fetch(url, init);
    if (response.ok) {
      return response.json() as Promise<T>;
    }

    const isRetriable = response.status >= 500;
    if (!isRetriable || attempt + 1 >= tries) {
      throw new Error(`Request failed ${response.status}`);
    }
  }

  throw new Error("Request failed");
}
