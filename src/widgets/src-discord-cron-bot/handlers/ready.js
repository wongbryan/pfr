const { timezone, rules } = require("../config");
const { CronJob } = require("cron");
const https = require("https");

const options = {
  hostname: "meme-api.herokuapp.com",
  path: "/gimme/wholesomememes",
  method: "GET",
};

class CronBot {
  constructor(client) {
    this.client = client;
  }

  async getWebhook(channelId) {
    const channel = await this.client.channels.fetch(channelId);
    const webhooks = await channel.fetchWebhooks();

    return !webhooks.size
      ? channel.createWebhook(this.client.user.username)
      : webhooks.first();
  }

  async sendMessage(channelId, message) {
    const webhook = await this.getWebhook(channelId);
    const newMessage = await webhook.send(message);
  }
}

module.exports = async (client) => {
  const cronExpression = "0 0 0/1 * * *";
  const bot = new CronBot(client);
  new CronJob(
    cronExpression,
    async () => {
      https
        .get("https://meme-api.herokuapp.com/gimme/wholesomememes", (res) => {
          let data = [];
          const headerDate =
            res.headers && res.headers.date
              ? res.headers.date
              : "no response date";
          console.log("Status Code:", res.statusCode);
          console.log("Date in Response header:", headerDate);

          res.on("data", (chunk) => {
            data.push(chunk);
          });

          res.on("end", async () => {
            console.log("Response ended: ");
            const json = JSON.parse(Buffer.concat(data).toString());
            const memeURL = json["url"];
            await bot.sendMessage(
              "865495139187032074",
              "<:helloeverybunny:837449515559551056>"
            );
            await bot.sendMessage("865495139187032074", memeURL);
          });
        })
        .on("error", (err) => {
          console.log("Error: ", err.message);
        });
    },
    null,
    true,
    timezone
  );
};
