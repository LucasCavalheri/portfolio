// Endereço convencional que ferramentas e crawlers procuram primeiro.
// A integração gera /sitemap-index.xml, então /sitemap.xml dava 404 — e o
// Search Console ainda tinha uma inscrição antiga nesse caminho, do site
// anterior, falhando a cada leitura. Aqui ele responde 200 com um índice
// válido, em vez de redirecionar: sitemap deve ser servido direto.
import { site } from "../data/site";

export const GET = () => {
  const agora = new Date().toISOString();
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "<sitemap>",
    `<loc>${site.url}/sitemap-0.xml</loc>`,
    `<lastmod>${agora}</lastmod>`,
    "</sitemap>",
    "</sitemapindex>",
  ].join("");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
};
