import _ from "lodash";
import { processQueens } from "../scrape/scrapeQueens";
import { processShows } from "../scrape/scrapeShows";
import type { Queen, Season } from "../types";

const BASE_FANDOM_URL = "https://rupaulsdragrace.fandom.com";

class ScrapeQueensCommand {
  constructor(private readonly args: { shows: string[] }) {}

  async execute() {
    const seasons: Season[] = [];
    await Promise.all(
      _.chunk(this.args.shows, 5).map(async (shows) => {
        const batchResults = await processShows(BASE_FANDOM_URL, shows);
        seasons.push(...batchResults);
      })
    );

    const uniqueQueens = _.uniqBy(
      seasons.flatMap((s) => s.contestants),
      "name"
    );

    const queens: Queen[] = [];
    await Promise.all(
      _.chunk(uniqueQueens, 50).map(async (qs) => {
        const batchResults = await processQueens(qs);
        queens.push(...batchResults);
      })
    );

    queens.sort((a, b) => a.name.localeCompare(b.name));

    return queens;
  }
}

export default ScrapeQueensCommand;
