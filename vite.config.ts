import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { pageSeoEnglish } from "./src/lib/seo";

function routeMetadataPlugin(siteUrl: string): Plugin {
  return {
    name: "meridian-route-metadata",
    generateBundle(_options, bundle) {
      const entry = bundle["index.html"];
      if (!entry || entry.type !== "asset") return;
      const baseHtml = String(entry.source);
      let canonicalOrigin = "";
      try {
        const configured = new URL(siteUrl);
        if (configured.protocol === "https:" || ["localhost", "127.0.0.1"].includes(configured.hostname)) {
          canonicalOrigin = configured.origin;
        }
      } catch {
        // No production origin is known yet; omit canonical and og:url rather than emit a placeholder.
      }
      for (const [route, metadata] of Object.entries(pageSeoEnglish)) {
        const title = escapeHtml(metadata.title);
        const description = escapeHtml(metadata.description);
        let html = baseHtml
          .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(" \/>)/, `$1${description}$2`)
          .replace(/(<meta property="og:title" content=")[^"]*(" \/>)/, `$1${title}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(" \/>)/, `$1${description}$2`)
          .replace(/(<meta name="twitter:title" content=")[^"]*(" \/>)/, `$1${title}$2`)
          .replace(/(<meta name="twitter:description" content=")[^"]*(" \/>)/, `$1${description}$2`);
        if (metadata.noindex) {
          html = html.replace("</head>", '    <meta name="robots" content="noindex,nofollow" />\n  </head>');
        }
        if (canonicalOrigin && !metadata.noindex) {
          const canonicalUrl = `${canonicalOrigin}${route === "/" ? "/" : route}`;
          html = html.replace("</head>", `    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />\n    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />\n  </head>`);
        }
        if (route === "/") {
          if (canonicalOrigin) {
            const canonicalUrl = `${canonicalOrigin}/`;
            entry.source = html.replace("</head>", `    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />\n    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />\n  </head>`);
          }
          continue;
        }
        this.emitFile({
          type: "asset",
          fileName: route === "/" ? "index.html" : `${route.slice(1)}/index.html`,
          source: html,
        });
      }
    },
  };
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "VITE_");
  return {
    plugins: [react(), routeMetadataPlugin(env.VITE_SITE_URL?.trim() ?? "")],
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
    },
    build: {
      sourcemap: false,
    },
  };
});
