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

let feeds = [];
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
        continue;
      }

      if (title !== feed.lastTitle) {
        feed.lastTitle = title;
        const targetChannel = feed.channelId || lastChannelId || process.env.SLACK_CHANNEL_ID;
        if (targetChannel) {
          await app.client.chat.postMessage({
            channel: targetChannel,
            text: `*New RSS Update:*\n*Feed:* <${feed.url}>\n*Latest Post:* <${link}|${title}>`
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
};

setInterval(checkFeeds, 60000);


app.command("/fiyan-ping", async ({ ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/fiyan-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text: "*Available Commands:*\n`/fiyan-ping` - Test bot latency\n`/fiyan-catfact` - Get a random cat fact\n`/fiyan-echo` - Echo a message\n`/fiyan-fakeword` - Get a fake word\n`/fiyan-joke` - Tell a random joke\n`/fiyan-rss` - Check, add, or remove RSS feeds"
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
  if (command.channel_id) {
    lastChannelId = command.channel_id;
  }

  const rawInput = command.text?.trim() || "";
  const matchUrl = rawInput.match(/https?:\/\/[^\s>|]+/i);
  const newLink = matchUrl ? matchUrl[0] : "";

  if (rawInput && !newLink) {
    await respond({
      text: "Please provide a valid RSS URL.\nUsage: `/fiyan-rss [url]` to add or remove a feed, or `/fiyan-rss` to check status."
    });
    return;
  }

  if (newLink) {
    const existingIndex = feeds.findIndex((f) => f.url === newLink);
    if (existingIndex !== -1) {
      feeds.splice(existingIndex, 1);
      await respond({
        text: `Removed RSS feed: <${newLink}>`
      });
      return;
    }

    const feed = {
      url: newLink,
      lastTitle: "",
      channelId: command.channel_id || ""
    };
    feeds.push(feed);

    try {
      const data = await parser.parseURL(newLink);
      if (!data.items || data.items.length === 0) {
        await respond({
          text: `Added RSS feed: <${newLink}>\nNo posts found in this feed yet.`
        });
        return;
      }

      const item = data.items[0];
      const title = item.title || "Untitled";
      const link = item.link || "No link found";

      feed.lastTitle = title;
      await respond({
        text: `*Added RSS Feed:*\n*Latest Post:* <${link}|${title}>`
      });
    } catch (err) {
      console.log(err);
      await respond({
        text: `Added <${newLink}>, but couldn't fetch latest post right now.`
      });
    }
    return;
  }

  if (feeds.length === 0) {
    await respond({
      text: "*RSS Status:*\nNo RSS feeds are being watched. Use `/fiyan-rss [url]` to add one."
    });
    return;
  }

  const results = [];
  for (const feed of feeds) {
    if (command.channel_id) {
      feed.channelId = command.channel_id;
    }

    try {
      const data = await parser.parseURL(feed.url);
      if (!data.items || data.items.length === 0) {
        results.push(`*Feed:* <${feed.url}>\nNo posts found.`);
        continue;
      }

      const item = data.items[0];
      const title = item.title || "Untitled";
      const link = item.link || "No link found";

      if (title === feed.lastTitle) {
        results.push(`*Feed:* <${feed.url}>\n*RSS Status:* All caught up! Latest post: <${link}|${title}>`);
      } else {
        feed.lastTitle = title;
        results.push(`*Feed:* <${feed.url}>\n*New RSS Update:* <${link}|${title}>`);
      }
    } catch (err) {
      console.log(err);
      results.push(`Failed to fetch RSS feed: <${feed.url}>`);
    }
  }

  await respond({ text: results.join("\n\n") });
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();
