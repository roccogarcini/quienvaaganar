// RSS proxy — devuelve hasta 6 artículos por fuente (TUDN, FIFA, JuanFutbol, SofaScore)
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  const feeds = [
    {
      id: "tudn",
      name: "TUDN",
      color: "#e10600",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/TUDN_logo.svg/120px-TUDN_logo.svg.png",
      url: "https://www.tudn.com/rss/news.xml",
    },
    {
      id: "fifa",
      name: "FIFA",
      color: "#1a6bb5",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/FIFA_logo_without_slogan.svg/80px-FIFA_logo_without_slogan.svg.png",
      url: "https://www.fifa.com/rss-feed/2026-fifa-world-cup/news/en",
    },
    {
      id: "juanfutbol",
      name: "JuanFútbol",
      color: "#f97316",
      logo: null,
      url: "https://juanfutbol.com/rss",
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
      const imageMatch = /<media:content[^>]*url="([^"]*)"/.exec(block)
        || /<enclosure[^>]*url="([^"]*)"/.exec(block)
        || /<media:thumbnail[^>]*url="([^"]*)"/.exec(block);
      const image = imageMatch ? imageMatch[1] : null;

      if (title && link) {
        items.push({
          source: sourceId,
          sourceName,
          sourceColor,
          title,
          link,
          pubDate,
          description,
          image,
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
      return parseItems(xml, feed.id, feed.name, feed.color);
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
