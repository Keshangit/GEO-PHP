export function normalizeDomain(url: string): string {
  let input = url.trim();

  if (!input.includes("://")) {
    input = `https://${input}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error("Invalid URL provided.");
  }

  let host = parsed.hostname.toLowerCase();

  if (host.startsWith("www.")) {
    host = host.slice(4);
  }

  if (!host) {
    throw new Error("Invalid URL provided.");
  }

  return host;
}

export function toFetchUrl(domain: string): string {
  return `https://${domain}/`;
}
