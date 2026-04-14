const ML_DOMAINS = ["mercadolivre.com.br", "mercadolibre.com"];

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

export async function extractMercadoLivreImage(
  url: string,
): Promise<string | null> {
  if (!isMercadoLivreUrl(url)) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; gift-registry/1.0; +wedding-site)",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    const match = html.match(
      /<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i,
    ) ??
      html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);

    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
