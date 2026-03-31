import { tool } from "ai";
import { z } from "zod";

const exchangeRateResponseSchema = z.object({
  rates: z.record(z.string(), z.number()),
});

const tavilyResponseSchema = z.object({
  results: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
        url: z.string(),
      }),
    )
    .optional(),
});

function extractCurrencies(query: string) {
  const regex = /\b([A-Z]{3})\b/g;
  const matches = query.match(regex);

  if (!matches || matches.length === 0) {
    return { from: "USD", to: "USD" };
  }

  return {
    from: matches[0] ?? "USD",
    to: matches[1] ?? matches[0] ?? "USD",
  };
}

export const webSearch = tool({
  description: "Search the web for up-to-date information",
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }: { query: string }) => {
    let results;
    const { from, to } = extractCurrencies(query);
    if (/exchange rate|usd|eur|npr/i.test(query)) {
      // Call the exchange rate api
      const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
      const data = exchangeRateResponseSchema.parse(await res.json());
      const rate = data.rates[to];

      results = [
        {
          title: `${from} -> ${to} Exchange Rate`,
          snippet:
            rate !== undefined
              ? `1 ${from} = ${rate} ${to}`
              : `Could not find ${to} conversion rate for ${from}.`,
        },
      ];
    } else {
      // call general web search API (Tavily / SerpAPI)
      const res = await fetch(
        `https://api.tavily.com/search?q=${encodeURIComponent(query)}`,
      );
      const raw = await res.json();
      const parsed = tavilyResponseSchema.safeParse(raw);

      if (!res.ok || !parsed.success || !parsed.data.results) {
        const message =
          raw && typeof raw === "object" && "error" in raw
            ? String((raw as { error: unknown }).error)
            : "Web search provider returned an unexpected response.";
        return [
          {
            title: "Web search unavailable",
            snippet: message,
          },
        ];
      }

      results = parsed.data.results.map((r) => ({
        title: r.title,
        snippet: r.content,
        url: r.url,
      }));
    }

    return results;
  },
});
