import * as cheerio from "cheerio";
import _ from "lodash";
import type { Contestant, Season } from "../types";
import { fetchWithRetry } from "../utils";

export async function processShows(
  baseUrl: string,
  shows: string[]
): Promise<Season[]> {
  const showSummaries = await Promise.all(
    shows.map(async (show) => getShowSummary(baseUrl, show))
  );

  const showsWithSummaries = _.zip(shows, showSummaries);

  return _.flatten(
    await Promise.all(
      showsWithSummaries.map(async ([show, summary]) =>
        processSeasonsForShow(baseUrl, {
          name: show!,
          numSeasons: summary!.latestSeason,
        })
      )
    )
  );
}

async function getShowSummary(
  baseUrl: string,
  show: string
): Promise<{
  name: string;
  latestSeason: number;
}> {
  const showUrl = `${baseUrl}/wiki/${show.replaceAll(" ", "_")}`;
  const response = await fetchWithRetry(showUrl);
  const $ = cheerio.load(await response.text());
  let latestSeason = 0;
  $("small").each((_, el) => {
    const text = $(el).text();
    const match = text.match(/(s\d+)/i); // (s1), (s2), etc.
    if (match?.[1]) {
      latestSeason = Math.max(latestSeason, parseInt(match[1].slice(1), 10));
    }
  });
  return {
    name: show,
    latestSeason,
  };
}

async function processSeasonsForShow(
  baseUrl: string,
  show: {
    name: string;
    numSeasons: number;
  }
): Promise<Season[]> {
  const seasonPromises = _.times(show.numSeasons, async (n) => {
    const i = n + 1;
    const seasonUrl = `${baseUrl}/wiki/${show.name.replace(
      " ",
      "_"
    )}_(Season_${i})`;

    const response = await fetchWithRetry(seasonUrl);

    const $seasonPage = cheerio.load(await response.text());
    const premiereYear = extractPremiereYear($seasonPage);
    const initialContestantsData = extractContestants($seasonPage, baseUrl);

    // Resolve final profile URL to address any name changes
    // For e.g, a contestant may be named "Bob" in S1, but on S2 they are named "Robert".
    // Visiting their latest profile page should always show their latest name.
    const finalContestantsData: Season["contestants"] = await Promise.all(
      initialContestantsData.map(async (contestant) => {
        const response = await fetchWithRetry(contestant.profileLink);
        return {
          name: contestant.name,
          profileImageUrl: contestant.profileImageUrl,
          profileLink: response.url,
        };
      })
    );

    return {
      show: show.name,
      season: i,
      year: premiereYear,
      contestants: finalContestantsData,
    };
  });

  return Promise.all(seasonPromises);
}

function extractPremiereYear($seasonPage: cheerio.CheerioAPI): number {
  const premiereText = $seasonPage('[data-source="premiere"] .pi-data-value')
    .text()
    .trim();
  const yearMatch = premiereText.match(/(\d{4})/);
  return parseInt(yearMatch?.[1] ?? "0", 10);
}

function extractContestants(
  $seasonPage: cheerio.CheerioAPI,
  baseUrl: string // used to construct links relative to root domain
): Contestant[] {
  const contestants: Contestant[] = [];
  $seasonPage("table").each((_, table) => {
    const hasRankHeader = $seasonPage(table).find("th").text().includes("Rank");

    if (hasRankHeader) {
      $seasonPage(table)
        .find("tr")
        .each((_, row) => {
          // Skip header rows
          if ($seasonPage(row).find("th").length > 0) return;

          const $row = $seasonPage(row);

          // Find all wiki page links (contestant names)
          $row.find('td b a[href*="/wiki/"]').each((_, el) => {
            const link = $seasonPage(el);
            const $currentTd = link.closest("td");

            // Look for image link in sibling td elements
            let profileImageUrl = "";
            const $siblingTds = $currentTd.siblings("td");
            const imageLink = $siblingTds.find('[typeof="mw:File"] a').first();
            if (imageLink.length > 0) {
              profileImageUrl = `${imageLink.attr("href") || ""}`;
            }

            contestants.push({
              name: link.text().trim(),
              profileImageUrl: profileImageUrl,
              profileLink: `${baseUrl}${link.attr("href") || ""}`,
            });
          });
        });
    }
  });

  return contestants;
}
