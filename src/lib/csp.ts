/** Builds the Content-Security-Policy for one page request. */
export function buildCsp(options: { nonce: string; dev: boolean; https: boolean; analyticsOrigin: string | null }): string {
  const { nonce, dev, https, analyticsOrigin } = options;
  const directives = [
    "default-src 'self'",
    // Scripts: only ours, carrying this request's nonce ('strict-dynamic' trusts what they load).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // React renders style="" attributes (e.g. the preview scale) which nonces cannot cover.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${analyticsOrigin ? ` ${analyticsOrigin}` : ""}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (https) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

export function analyticsOrigin(): string | null {
  const raw = process.env.ANALYTICS_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}
