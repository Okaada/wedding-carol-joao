const ML_DOMAINS = ["mercadolivre.com.br", "mercadolibre.com"];
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 5000;

export function isMercadoLivreUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return ML_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

async function fetchWithManualRedirects(
  initialUrl: string,
  signal: AbortSignal,
): Promise<Response | null> {
  let current = initialUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(current);
    } catch {
      return null;
    }
    if (parsed.protocol !== "https:") return null;
    if (!isMercadoLivreUrl(current)) return null;

    const response = await fetch(current, {
      signal,
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; gift-registry/1.0; +wedding-site)",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      try {
        current = new URL(location, current).toString();
      } catch {
        return null;
      }
      continue;
    }

    return response;
  }
  return null;
}

export async function extractMercadoLivreImage(
  url: string,
): Promise<string | null> {
  if (!isMercadoLivreUrl(url)) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response | null;
    try {
      response = await fetchWithManualRedirects(url, controller.signal);
    } finally {
      clearTimeout(timeout);
    }

    if (!response || !response.ok) return null;

    const html = await response.text();
    const match =
      html.match(
        /<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i,
      ) ??
      html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);

    const image = match?.[1] ?? null;
    if (!image) return null;
    try {
      const imageUrl = new URL(image);
      if (imageUrl.protocol !== "https:" && imageUrl.protocol !== "http:") {
        return null;
      }
    } catch {
      return null;
    }
    return image;
  } catch {
    return null;
  }
}
