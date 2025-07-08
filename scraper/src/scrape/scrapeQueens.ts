import * as cheerio from "cheerio";
import type { Contestant, Look, Queen } from "../types";
import { fetchWithRetry } from "../utils";

export async function processQueens(
  contestants: Contestant[]
): Promise<Queen[]> {
  return Promise.all(
    contestants.map(async (c): Promise<Queen> => {
      const response = await fetchWithRetry(c.profileLink ?? "");
      const $contestantPage = cheerio.load(await response.text());
      const details = await extractQueenDetails($contestantPage);
      return {
        id: crypto.randomUUID(),
        name: c.name,
        profileImageUrl: c.profileImageUrl,
        profileLink: c.profileLink,
        looks: details.looks,
      };
    })
  );
}

/**
 * This will grab ALL looks across ALL shows and seasons.
 * Consumers of this data should do the filtering.
 */
async function extractQueenDetails(
  $contestantPage: cheerio.CheerioAPI
): Promise<{ looks: Look[] }> {
  const allLooks: Look[] = [];

  // For some reason the "Looks" heading could be an h3 or h4, so we need to check both..
  $contestantPage("h3, h4").each((_, heading) => {
    const headingText = $contestantPage(heading).text();
    if (!headingText.includes("Looks")) return;

    const seasonMatch = headingText.match(/Season (\d+) Looks/);
    const seasonNum = seasonMatch ? parseInt(seasonMatch[1] ?? "", 10) : null;
    const showName = headingText.slice(0, headingText.indexOf(" Season"));

    const gallery = $contestantPage(heading).next(".wikia-gallery");
    gallery.find(".wikia-gallery-item").each((_, item) => {
      const imgEl = $contestantPage(item).find("img");
      const captionEl = $contestantPage(item).find(".lightbox-caption");

      const imgUrl = imgEl.attr("data-src") || imgEl.attr("src");
      const caption = captionEl.text().trim() || imgEl.attr("alt") || "";

      if (imgUrl && caption && imgUrl.includes("static.wikia.nocookie.net")) {
        const fullSizeImg = imgUrl.split("/revision/")?.[0] || imgUrl;

        allLooks.push({
          caption: caption.replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
          imageUrl: fullSizeImg,
          season: {
            show: showName,
            season: seasonNum ?? -1,
          },
        });
      }
    });
  });

  return { looks: allLooks };
}
