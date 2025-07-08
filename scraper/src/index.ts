import ScrapeQueensCommand from "./commands/scrape-queens-command";

const queens = await new ScrapeQueensCommand({
  shows: ["RuPaul's Drag Race"],
}).execute();

await Bun.stdout.write(JSON.stringify(queens, null, 2) + "\n");
