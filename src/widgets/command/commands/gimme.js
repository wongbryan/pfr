const CommandBuilder = require("../classes/CommandBuilder");
const Scraper = require("images-scraper");
const flatCache = require("flat-cache");
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

const searchCache = flatCache.load("gimme-search-cache");

const QUERY_LIMIT = 250;

const JOB_TTL = 120000;

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
    console.log("current jobs: ");
    console.log(scraperJobs);
    if (searchCache.getKey(query) == null) {
      // If too many jobs, send busy message
      if (Object.keys(scraperJobs).length > 2) {
        let hasSpaceInQueue = false;
        Object.keys(scraperJobs).forEach((key) => {
          if (Date.now() - scraperJobs[key].time > JOB_TTL) {
            delete scraperJobs[key];
            hasSpaceInQueue = true;
          }
        });
        if (!hasSpaceInQueue) {
          const index = Math.floor(
            Object.keys(scraperJobs).length * Math.random()
          );
          const scraperJobQuery = Object.keys(scraperJobs)[index];
          const scraperJobUser = scraperJobs[scraperJobQuery].username;
          await message.channel.send(
            "I'm busy getting " +
              scraperJobQuery +
              " for " +
              scraperJobUser +
              ". Please try again in a few."
          );
          return;
        }
      }
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
        scraperJobs[query] = { username: user.username, time: Date.now() };
        await message.channel.send(
          "<:helloeverybunny:837449515559551056> Please wait, I'm getting you some " +
            query +
            " (can take up to a minute if it's your first time searching for this)"
        );
        google
          .scrape(query, QUERY_LIMIT)
          .then((results) => {
            const index = Math.floor(Math.random() * results.length);
            searchCache.setKey(query, results);
            searchCache.save(true);
            if (results[index].url != undefined) {
              message.channel.send(`Here's your ${query}:`).then(() => {
                message.channel
                  .send(results[index].url)
                  .then(() => delete scraperJobs[query]);
              });
            } else {
              message.channel
                .send(
                  results[index].url != undefined
                    ? results[index].url
                    : "Couldn't find an image. Try asking me again."
                )
                .then(() => delete scraperJobs[query]);
            }
          })
          .catch((e) => {
            console.log(e);
            message.channel
              .send("Couldn't find an image. Try asking me again.")
              .then(() => delete scraperJobs[query]);
          });
      }
    } else {
      console.log(searchCache.getKey(query));
      results = searchCache.getKey(query);
      const index = Math.floor(Math.random() * results.length) + 1;
      await message.channel.send(
        results[index].url != undefined
          ? results[index].url
          : "Couldn't find an image. Try asking me again."
      );
    }
  });
