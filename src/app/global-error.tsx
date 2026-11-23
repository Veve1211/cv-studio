"use client";

/**
 * Last resort when the root layout itself fails. It replaces the whole document, so it
 * has its own <html>/<body> and inline styles (global CSS and fonts are not loaded here).
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="cs">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "0 16px",
          background: "#f4f8fc",
          color: "#0f1b2d",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <title>Něco se pokazilo – Cvéčko</title>
        <main>
          <h1 style={{ fontSize: "1.9rem", margin: 0 }}>Něco se pokazilo</h1>
          <p style={{ color: "#44546a", marginTop: 8 }}>Omlouváme se. Zkus to prosím znovu.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 32,
              minHeight: 44,
              padding: "12px 24px",
              border: 0,
              borderRadius: 999,
              background: "#9fd3ff",
              color: "#0b2a4a",
              font: "inherit",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Zkusit znovu
          </button>
        </main>
      </body>
    </html>
  );
}
