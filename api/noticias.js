// RSS proxy — devuelve hasta 6 artículos por fuente (TUDN, FIFA, JuanFutbol, SofaScore)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  const feeds = [
    {
      id: "marca",
      name: "Marca Fútbol",
      color: "#e10600",
      url: "https://www.marca.com/rss/futbol.xml",
      fallbackImage: "https://e00-marca.uecdn.es/assets/v3/images/og-marca.jpg",
    },
    {
      id: "fifa",
      name: "ESPN Fútbol",
      color: "#1a6bb5",
      url: "https://www.espn.com/espn/rss/soccer/news",
      fallbackImage: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/leagues/500/FIFA.png&h=300&w=300",
    },
    {
      id: "juanfutbol",
      name: "JuanFútbol",
      color: "#f97316",
      url: "https://juanfutbol.com/rss",
      fallbackImage: null,
    },
  ];

  function parseItems(xml, sourceId, sourceName, sourceColor) {
    const items = [];
    // Extract <item> blocks
    const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let m;
    while ((m = itemRe.exec(xml)) !== null) {
      const block = m[1];
      const get = (tag) => {
        const r = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
        const match = r.exec(block);
        if (!match) return "";
        return (match[1] || match[2] || "").trim();
      };
      const getAttr = (tag, attr) => {
        const r = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
        const match = r.exec(block);
        return match ? match[1] : "";
      };

      const title = get("title").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      const link = get("link") || getAttr("link", "href");
      const pubDate = get("pubDate") || get("dc:date") || get("published");
      const description = get("description").replace(/<[^>]+>/g, "").slice(0, 200);
      // 1. Etiquetas estándar de medios en RSS
      const imageMatch = /<media:content[^>]*url="([^"]*)"/.exec(block)
        || /<enclosure[^>]*url="([^"]*)"/.exec(block)
        || /<media:thumbnail[^>]*url="([^"]*)"/.exec(block);
      let image = imageMatch ? imageMatch[1] : null;

      // 2. Fallback: primera <img src="..."> dentro de content:encoded o description
      if (!image) {
        const contentRaw = (() => {
          const r = /<content:encoded[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i.exec(block)
            || /<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i.exec(block);
          return r ? r[1] : "";
        })();
        const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(contentRaw);
        if (imgMatch) {
          // Quita sufijo WordPress (-150x150, -300x200, etc.) para obtener tamaño original
          image = imgMatch[1].replace(/-\d+x\d+(\.\w+)$/, "$1");
        }
      }

      if (title && link) {
        items.push({
          source: sourceId,
          sourceName,
          sourceColor,
          title,
          link,
          pubDate,
          description,
          image,          // puede ser null — el frontend usa fallbackImage por fuente
        });
      }
      if (items.length >= 6) break;
    }
    return items;
  }

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const r = await fetch(feed.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; quienvaaganar/1.0)",
          "Accept": "application/rss+xml, application/xml, text/xml",
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const xml = await r.text();
      const items = parseItems(xml, feed.id, feed.name, feed.color);
      // Aplica fallbackImage a artículos sin imagen
      if (feed.fallbackImage) {
        items.forEach(it => { if (!it.image) it.image = feed.fallbackImage; });
      }
      return items;
    })
  );

  const allItems = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      allItems.push(...r.value);
    } else {
      console.error(`Feed ${feeds[i].id} failed:`, r.reason?.message);
    }
  });

  // Sort by pubDate descending (best-effort)
  allItems.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate) : 0;
    const db = b.pubDate ? new Date(b.pubDate) : 0;
    return db - da;
  });

  res.json({ items: allItems, fetchedAt: new Date().toISOString() });
}
