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
    args: ["--no-sandbox"],
  },
});

const searchCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

const QUERY_LIMIT = 500;

let scraperJobs = {};

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
    const query = args.join(" ").toLowerCase();
    let results;
    if (searchCache.get(query) == null) {
      // If query already in job queue, send busy msg
      if (scraperJobs[query] != null) {
        await message.channel.send(
          "You already asked me for " +
            query +
            "! Be patient " +
            user.username +
            " 😠"
        );
        return;
      } else {
        scraperJobs[query] = user.username;
        await message.channel.send(
          "<:helloeverybunny:837449515559551056> Please wait, I'm getting you some " +
            query +
            " (can take up to a minute if it's your first time searching for this)"
        );
        google
          .scrape(query, QUERY_LIMIT)
          .then((results) => {
            const index = Math.floor(Math.random() * results.length);
            searchCache.set(query, results);
            message.channel
              .send(
                results[index].url != undefined
                  ? results[index].url
                  : "Couldn't find an image. Try asking me again."
              )
              .then(() => delete scraperJobs[query]);
          })
          .catch((e) => {
            console.log(e);
            delete scraperJobs[query];
          });
      }
      // If too many jobs, send busy message
      if (Object.keys(scraperJobs).length > 2) {
        const index = Math.floor(
          Object.keys(scraperJobs).length * Math.random()
        );
        const scraperJobQuery = Object.keys(scraperJobs)[index];
        const scraperJobUser = scraperJobs[scraperJobQuery];
        await message.channel.send(
          "I'm busy getting " +
            scraperJobQuery +
            " for " +
            scraperJobUser +
            ". Please try again in a few."
        );
        return;
      }
    } else {
      results = searchCache.get(query);
      const index = Math.floor(Math.random() * results.length) + 1;
      await message.channel.send(
        results[index].url != undefined
          ? results[index].url
          : "Couldn't find an image. Try asking me again."
      );
    }
  });
