require("dotenv").config();
const { App } = require("@slack/bolt");
const axios = require("axios");
const Parser = require("rss-parser");
const parser = new Parser();
const { loadFeeds, saveFeeds } = require("./storage");


const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

let feeds = loadFeeds();
let lastChannelId = "";

const checkFeeds = async () => {
  for (const feed of feeds) {
    try {
      const data = await parser.parseURL(feed.url);
      if (!data.items || data.items.length === 0) {
        continue;
      }

      const item = data.items[0];
      const title = item.title || "Untitled";
      const link = item.link || "No link found";

      if (!feed.lastTitle) {
        feed.lastTitle = title;
        saveFeeds(feeds);
        continue;
      }

      if (title !== feed.lastTitle) {
        feed.lastTitle = title;
        saveFeeds(feeds);
        const targetChannel = feed.channelId || lastChannelId || process.env.SLACK_CHANNEL_ID;
        if (targetChannel) {
          await app.client.chat.postMessage({
            channel: targetChannel,
            text: `📢 *New RSS Update:*\n📡 *Feed:* <${feed.url}>\n📰 *Latest Post:* <${link}|${title}>`
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
};

let checkInterval = 60000;
setInterval(checkFeeds, checkInterval);


app.command("/fiyan-ping", async ({ ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `🏓 *Pong!*\n⏱️ Latency: ${latency}ms` });
});

app.command("/fiyan-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text: "*🤖 Available Commands:*\n🏓 `/fiyan-ping` - Test bot latency\n🐱 `/fiyan-catfact` - Get a random cat fact\n📢 `/fiyan-echo` - Echo a message\n📖 `/fiyan-fakeword` - Get a fake word\n😂 `/fiyan-joke` - Tell a random joke\n💡 `/fiyan-advice` - Get random advice\n🪙 `/fiyan-coin` - Flip a coin\n🎲 `/fiyan-dice` - Roll a dice\n🧠 `/fiyan-uselessfact` - Get a useless fact\n📰 `/fiyan-rss` - Check, add, or remove RSS feeds"
  });
});


app.command("/fiyan-catfact", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `🐱 *Cat Fact:*\n${response.data.fact}` });
  } catch (err) {
    console.log(err);
    await respond({ text: "❌ Failed to fetch a cat fact." });
  }
});


app.command("/fiyan-echo", async ({ ack, respond, command }) => {
  await ack();
  const text = command.text?.trim();
  if (!text) {
    await respond({
      text: "⚠️ Usage: `/fiyan-echo [text]`"
    });
    return;
  }
  await respond({
    text: `📢 ${text}`
  });
});

app.command("/fiyan-fakeword", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://www.thisworddoesnotexist.com/api/random_word.json");
    const data = response.data.word;
    const exampleBlock = data.example ? `\n*Example:* _"${data.example}"_` : "";

    await respond({
      text: `📖 *Fake Word:* *${data.word}*\n*Part of Speech:* _${data.pos}_\n*Meaning:* ${data.definition}${exampleBlock}`
    });
  } catch (err) {
    console.log(err);
    await respond({ text: "❌ Failed to fetch a fake word." });
  }
});

app.command("/fiyan-joke", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      text: `😂 *Joke:*\n${response.data.setup}\n_${response.data.punchline}_`
    });
  } catch (err) {
    console.log(err);
    await respond({ text: "❌ Failed to fetch a joke." });
  }
});


app.command("/fiyan-advice", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://api.adviceslip.com/advice");
    const advice = response.data?.slip?.advice || "No advice found.";
    await respond({ text: `💡 *Advice:*\n"${advice}"` });
  } catch (err) {
    console.log(err);
    await respond({ text: "❌ Failed to fetch advice." });
  }
});


app.command("/fiyan-coin", async ({ ack, respond }) => {
  await ack();
  const result = Math.random() < 0.5 ? "Heads" : "Tails";
  await respond({ text: `🪙 *Coin Flip:* *${result}*` });
});


app.command("/fiyan-dice", async ({ ack, respond, command }) => {
  await ack();
  const text = command.text?.trim() || "";
  let sides = parseInt(text, 10);
  if (isNaN(sides) || sides < 2) {
    sides = 6;
  }
  const roll = Math.floor(Math.random() * sides) + 1;
  await respond({ text: `🎲 *Dice Roll (d${sides}):* *${roll}*` });
});


app.command("/fiyan-uselessfact", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://uselessfacts.jsph.pl/api/v2/facts/random");
    const fact = response.data?.text || "No fact found.";
    await respond({ text: `🧠 *Useless Fact:*\n${fact}` });
  } catch (err) {
    console.log(err);
    await respond({ text: "❌ Failed to fetch a useless fact." });
  }
});


app.command("/fiyan-rss", async ({ ack, respond, command }) => {
  await ack();
  if (command.channel_id) {
    lastChannelId = command.channel_id;
  }

  const rawInput = command.text?.trim() || "";
  const matchUrl = rawInput.match(/https?:\/\/[^\s>|]+/i);
  const newLink = matchUrl ? matchUrl[0] : "";

  if (rawInput && !newLink) {
    await respond({
      text: "⚠️ Please provide a valid RSS URL.\nUsage: `/fiyan-rss [url]` to add or remove a feed, or `/fiyan-rss` to check status."
    });
    return;
  }

  if (newLink) {
    const existingIndex = feeds.findIndex((f) => f.url === newLink);
    if (existingIndex !== -1) {
      feeds.splice(existingIndex, 1);
      saveFeeds(feeds);
      await respond({
        text: `🗑️ Removed RSS feed: <${newLink}>`
      });
      return;
    }

    const feed = {
      url: newLink,
      lastTitle: "",
      channelId: command.channel_id || ""
    };
    feeds.push(feed);
    saveFeeds(feeds);

    try {
      const data = await parser.parseURL(newLink);
      if (!data.items || data.items.length === 0) {
        await respond({
          text: `📰 Added RSS feed: <${newLink}>\nNo posts found in this feed yet.`
        });
        return;
      }

      const item = data.items[0];
      const title = item.title || "Untitled";
      const link = item.link || "No link found";

      feed.lastTitle = title;
      saveFeeds(feeds);
      await respond({
        text: `📰 *Added RSS Feed:*\n*Latest Post:* <${link}|${title}>`
      });
    } catch (err) {
      console.log(err);
      await respond({
        text: `⚠️ Added <${newLink}>, but couldn't fetch latest post right now.`
      });
    }
    return;
  }

  if (feeds.length === 0) {
    await respond({
      text: "📰 *RSS Status:*\nNo RSS feeds are being watched. Use `/fiyan-rss [url]` to add one."
    });
    return;
  }

  const results = [];
  for (const feed of feeds) {
    if (command.channel_id && feed.channelId !== command.channel_id) {
      feed.channelId = command.channel_id;
      saveFeeds(feeds);
    }

    try {
      const data = await parser.parseURL(feed.url);
      if (!data.items || data.items.length === 0) {
        results.push(`📡 *Feed:* <${feed.url}>\nNo posts found.`);
        continue;
      }

      const item = data.items[0];
      const title = item.title || "Untitled";
      const link = item.link || "No link found";

      if (title === feed.lastTitle) {
        results.push(`📡 *Feed:* <${feed.url}>\n✅ *RSS Status:* All caught up! Latest post: <${link}|${title}>`);
      } else {
        feed.lastTitle = title;
        saveFeeds(feeds);
        results.push(`📡 *Feed:* <${feed.url}>\n📰 *New RSS Update:* <${link}|${title}>`);
      }
    } catch (err) {
      console.log(err);
      results.push(`❌ Failed to fetch RSS feed: <${feed.url}>`);
    }
  }

  await respond({ text: results.join("\n\n") });
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();
