const CommandBuilder = require("../classes/CommandBuilder");
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
    let sr;
    if (args.length === 0) {
      sr = subreddits[Math.floor(Math.random() * subreddits.length)]["name"];
    } else {
      if (args[0] === "help" || args[0] === "commands") {
        await message.channel.send(
          "<:helloeverybunny:837449515559551056>\n\nHere are some subreddits I can give you:\nanimegifs (a, anime)\ngifs(gif, g)\nbadmemes (b, bad),\ndankmemes (dank, d)\nwholesomememes (wholesome, seratonin, dopaine, w)\nkpop (k)\nmildlyinteresting (interesting)\nme_irl (meme, lol, me)\ndataisbeautiful (chart, graph)\nfood (eats, flavor, taste, hungry, hungo)"
        );
        return;
      }
      const searcher = new FuzzySearch(subreddits, ["name", "aliases"], {
        caseSensitive: false,
      });
      const searchResults = searcher.search(args[0]);
      sr =
        searchResults.length > 0
          ? searchResults[0]["name"]
          : subreddits[Math.floor(Math.random() * subreddits.length)]["name"];
    }
    const response = await fetch(`https://meme-api.herokuapp.com/gimme/${sr}`);
    const json = await response.json();
    await message.channel.send(json.url);
  });
