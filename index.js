require("dotenv").config();
const { App } = require("@slack/bolt");
const axios = require("axios");
const Parser = require("rss-parser");
const parser = new Parser();


const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

let website = "https://news.ycombinator.com/rss";
let lastTitle = "";


app.command("/fiyan-ping", async ({ ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/fiyan-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text: "*Available Commands:*\n`/fiyan-ping` - Test bot latency\n`/fiyan-catfact` - Get a random cat fact\n`/fiyan-echo` - Echo a message\n`/fiyan-fakeword` - Get a fake word\n`/fiyan-joke` - Tell a random joke\n`/fiyan-rss` - Check or set RSS feed"
  });
});


app.command("/fiyan-catfact", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `*Cat Fact:*\n${response.data.fact}` });
  } catch (err) {
    console.log(err);
    await respond({ text: "Failed to fetch a cat fact." });
  }
});


app.command("/fiyan-echo", async ({ ack, respond, command }) => {
  await ack();
  const text = command.text?.trim();
  if (!text) {
    await respond({
      text: "Usage: `/fiyan-echo [text]`"
    });
    return;
  }
  await respond({
    text: text
  });
});

app.command("/fiyan-fakeword", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://www.thisworddoesnotexist.com/api/random_word.json");
    const data = response.data.word;
    const exampleBlock = data.example ? `\n*Example:* _"${data.example}"_` : "";

    await respond({
      text: `*Fake Word:* *${data.word}*\n*Part of Speech:* _${data.pos}_\n*Meaning:* ${data.definition}${exampleBlock}`
    });
  } catch (err) {
    console.log(err);
    await respond({ text: "Failed to fetch a fake word." });
  }
});

app.command("/fiyan-joke", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      text: `*Joke:*\n${response.data.setup}\n_${response.data.punchline}_`
    });
  } catch (err) {
    console.log(err);
    await respond({ text: "Failed to fetch a joke." });
  }
});


app.command("/fiyan-rss", async ({ ack, respond, command }) => {
  await ack();
  const newLink = command.text?.trim();
  if (newLink) {
    website = newLink;
    lastTitle = "";
  }

  try {
    const feed = await parser.parseURL(website);
    if (!feed.items || feed.items.length === 0) {
      await respond({ text: "No posts found in this feed." });
      return;
    }

    const item = feed.items[0];
    const title = item.title || "Untitled";
    const link = item.link || "No link found";

    if (title === lastTitle) {
      await respond({
        text: `*RSS Status:*\nAll caught up! Latest post: <${link}|${title}>`
      });
      return;
    }

    lastTitle = title;
    await respond({
      text: `*New RSS Update:*\n*Latest Post:* <${link}|${title}>`
    });
  } catch (err) {
    console.log(err);
    await respond({ text: "Failed to fetch RSS feed." });
  }
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();
