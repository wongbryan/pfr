const CommandBuilder = require("../classes/CommandBuilder");
const Scraper = require("images-scraper");
const NodeCache = require("node-cache");
const fetch = require("node-fetch");
const { RedditSimple } = require("reddit-simple");
const FuzzySearch = require("fuzzy-search");

const options = {
  hostname: "meme-api.herokuapp.com",
  path: "/gimme/wholesomememes",
  method: "GET",
};

const subreddits = [
  { name: "badmemes", aliases: ["b, bad"] },
  { name: "dankmemes", aliases: ["d, dank"] },
  {
    name: "wholesomememes",
    aliases: ["wholesome, w", "seratonin", "dopamine"],
  },
  { name: "animegifs", aliases: ["anime", "a"] },
  { name: "kpop", aliases: ["k"] },
  { name: "mildlyinteresting", aliases: ["interesting"] },
  { name: "me_irl", aliases: ["lol", "me", "meme"] },
  { name: "dataisbeautiful", aliases: ["chart", "graph"] },
  {
    name: "food",
    aliases: ["hungo", "hungry", "f", "eats", "flavor", "taste"],
  },
  { name: "gifs", aliases: ["gif", "g"] },
];

const google = new Scraper({
  puppeteer: {
    headless: true,
  },
});

const searchCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

const QUERY_LIMIT = 500;

module.exports = new CommandBuilder()
  .setAliases(["g", "gimme"])
  .setOwnersOnly(false)
  .setGuildOnly(false)
  .setRequireArgs(false)
  .setDeletable(false)
  .setCooldown(1)
  .setDisabled(false)
  // eslint-disable-next-line
  .setExecute(async (message, user, args) => {
    const query = args.join(" ");
    let results;
    if (searchCache.get(query) == null) {
      results = await google.scrape(query, QUERY_LIMIT);
      searchCache.set(query, results);
    } else {
      results = searchCache.get(query);
    }
    await message.channel.send(
      results[Math.floor(Math.random() * results.length)].url
    );
  });
