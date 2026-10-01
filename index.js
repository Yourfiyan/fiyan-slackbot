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

const checkFeeds = async () => {
  for (const feed of feeds) {
    try {
      const data = await parser.parseURL(feed.url);
      if (!data.items || data.items.length === 0) {
        continue;
      }

      if (!feed.title && data.title) {
        feed.title = data.title;
        saveFeeds(feeds);
      }

      if (!feed.lastTitle) {
        feed.lastTitle = data.items[0].title || "";
        saveFeeds(feeds);
        continue;
      }

      const newItems = [];
      for (const item of data.items) {
        const itemTitle = item.title || "Untitled";
        if (itemTitle === feed.lastTitle) {
          break;
        }
        newItems.push(item);
        if (newItems.length >= 3) {
          break;
        }
      }

      if (newItems.length > 0) {
        feed.lastTitle = data.items[0].title || "Untitled";
        saveFeeds(feeds);

        const targetChannel = feed.channelId || process.env.SLACK_CHANNEL_ID;
        if (targetChannel) {
          const feedName = feed.title ? `*${feed.title}*` : `<${feed.url}>`;
          for (const item of newItems.reverse()) {
            const title = item.title || "Untitled";
            const link = item.link || feed.url;
            const snippet = item.contentSnippet ? `\n>${item.contentSnippet.slice(0, 140).replace(/\n/g, " ")}...` : "";

            await app.client.chat.postMessage({
              channel: targetChannel,
              text: `:party_parrot: *New post from ${feedName}:*\n:newspaper: <${link}|${title}>${snippet}`
            });
          }
        }
      }
    } catch (err) {
      console.error(`Feed check error for ${feed.url}:`, err.message || err);
    }
  }
};

let checkInterval = 60000;
setInterval(checkFeeds, checkInterval);


app.command("/fiyan-ping", async ({ ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  let comment = ":zap: Blazing fast!";
  if (latency > 250) {
    comment = ":loading: Running a little slow today.";
  } else if (latency > 100) {
    comment = ":dino-dance: Pretty decent!";
  }
  await respond({ text: `:ping_pong: *Pong!* Latency: ${latency}ms — _${comment}_` });
});


app.command("/fiyan-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text: "*:blob-wave: Knowfiyan Commands:* :party_parrot:\n\n" +
      "*📰 RSS Reader:*\n" +
      "• `/fiyan-rss` - View all watched feeds\n" +
      "• `/fiyan-rss <url>` - Add a feed to watch\n" +
      "• `/fiyan-rss read <number>` - Read top 3 stories from a feed\n" +
      "• `/fiyan-rss remove <number>` - Remove a feed\n" +
      "• `/fiyan-rss check` - Check for new posts right now\n" +
      "• `/fiyan-rss hackernews` - Quick-add Hacker News\n" +
      "• `/fiyan-rss hackclub` - Quick-add Hack Club Scrapbook\n\n" +
      "*🛠️ Hacker Utilities:*\n" +
      "• `/fiyan-github <owner/repo>` - Check live GitHub repo stats\n" +
      "• `/fiyan-poll \"Question\" \"Opt1\" \"Opt2\"` - Start an in-channel poll\n" +
      "• `/fiyan-dice [count]d[sides]` - Roll tabletop dice (e.g. `2d6`, `d20`)\n" +
      "• `/fiyan-coin` - Flip a coin with commentary\n" +
      "• `/fiyan-echo [text]` - Echo text (try `yell` or `reverse`)\n" +
      "• `/fiyan-ping` - Test bot latency\n\n" +
      "*🎮 Fun & Jokes:*\n" +
      "• `/fiyan-meme` - Grab a safe Reddit meme\n" +
      "• `/fiyan-joke` - Programmer & dev jokes\n" +
      "• `/fiyan-catfact` - Random cat fact\n" +
      "• `/fiyan-advice` - Random advice\n" +
      "• `/fiyan-fakeword` - Made-up word\n" +
      "• `/fiyan-uselessfact` - Random useless fact"
  });
});


app.command("/fiyan-github", async ({ ack, respond, command }) => {
  await ack();
  const repo = command.text?.trim();
  if (!repo) {
    await respond({
      text: ":warning: Usage: `/fiyan-github <owner/repo>` (e.g. `/fiyan-github hackclub/hackclub`)"
    });
    return;
  }

  try {
    const res = await axios.get(`https://api.github.com/repos/${repo}`, {
      headers: { "User-Agent": "Knowfiyan-SlackBot" }
    });
    const d = res.data;
    const stars = d.stargazers_count?.toLocaleString() || 0;
    const forks = d.forks_count?.toLocaleString() || 0;
    const lang = d.language || "Plain text";
    const desc = d.description || "No description provided.";

    await respond({
      text: `:octocat: *<${d.html_url}|${d.full_name}>*\n` +
        `>${desc}\n\n` +
        `:star: *${stars}* stars | :fork_and_knife: *${forks}* forks | :computer: *${lang}*`
    });
  } catch (err) {
    console.error("github error:", err.message || err);
    await respond({
      text: `:x: Couldn't find GitHub repo \`${repo}\`. Make sure it's in the format \`owner/repo\` and is public!`
    });
  }
});


app.command("/fiyan-poll", async ({ ack, respond, command }) => {
  await ack();
  const raw = command.text?.trim() || "";
  const matches = raw.match(/"([^"]+)"|'([^']+)'|(\S+)/g);
  if (!matches || matches.length < 3) {
    await respond({
      text: ":warning: Usage: `/fiyan-poll \"Question\" \"Option 1\" \"Option 2\" ...`"
    });
    return;
  }

  const clean = matches.map((m) => m.replace(/^["']|["']$/g, ""));
  const question = clean[0];
  const options = clean.slice(1, 10);
  const numberEmojis = [":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:"];

  const optionsText = options.map((opt, i) => `${numberEmojis[i]} ${opt}`).join("\n");
  await respond({
    response_type: "in_channel",
    text: `:bar_chart: *Poll:* *${question}*\n\n${optionsText}\n\n_React with numbers to vote!_ :party_parrot:`
  });
});


app.command("/fiyan-joke", async ({ ack, respond }) => {
  await ack();
  try {
    const res = await axios.get("https://v2.jokeapi.dev/joke/Programming,Miscellaneous?blacklistFlags=nsfw,religious,political,racist,sexist");
    const data = res.data;
    if (data.type === "twopart") {
      await respond({
        text: `:pepe-laugh: *Joke:*\n${data.setup}\n_${data.delivery}_`
      });
    } else {
      await respond({
        text: `:pepe-laugh: *Joke:*\n${data.joke}`
      });
    }
  } catch (err) {
    console.error("joke error:", err.message || err);
    await respond({ text: ":zipper_mouth_face: The joke API went quiet. Try again in a second!" });
  }
});


app.command("/fiyan-catfact", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `:catjam: *Cat Fact:*\n${response.data.fact}` });
  } catch (err) {
    console.error("catfact error:", err.message || err);
    await respond({ text: ":crying_cat_face: Couldn't fetch a cat fact right now. The cat must be sleeping!" });
  }
});


app.command("/fiyan-echo", async ({ ack, respond, command }) => {
  await ack();
  const text = command.text?.trim();
  if (!text) {
    await respond({
      text: ":warning: Usage: `/fiyan-echo [text]` (or try `/fiyan-echo yell [text]` or `/fiyan-echo reverse [text]`)"
    });
    return;
  }

  if (text.startsWith("yell ")) {
    await respond({ text: `:mega: *${text.slice(5).toUpperCase()}!!!* :party_parrot:` });
    return;
  }
  if (text.startsWith("reverse ")) {
    const rev = text.slice(8).split("").reverse().join("");
    await respond({ text: `:arrows_counterclockwise: ${rev}` });
    return;
  }

  await respond({ text: `:mega: ${text}` });
});


app.command("/fiyan-fakeword", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://www.thisworddoesnotexist.com/api/random_word.json");
    const data = response.data.word;
    const exampleBlock = data.example ? `\n*Example:* _"${data.example}"_` : "";

    await respond({
      text: `:book: *Fake Word:* *${data.word}*\n*Part of Speech:* _${data.pos}_\n*Meaning:* ${data.definition}${exampleBlock}`
    });
  } catch (err) {
    console.error("fakeword error:", err.message || err);
    await respond({ text: ":books: The dictionary is speechless right now. Try again in a bit!" });
  }
});


app.command("/fiyan-advice", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://api.adviceslip.com/advice");
    const advice = response.data?.slip?.advice || "No advice found.";
    await respond({ text: `:bulb: *Advice:*\n"${advice}"` });
  } catch (err) {
    console.error("advice error:", err.message || err);
    await respond({ text: ":thinking_face: No advice right now, you're on your own for this one!" });
  }
});


app.command("/fiyan-coin", async ({ ack, respond }) => {
  await ack();
  const isHeads = Math.random() < 0.5;
  const result = isHeads ? "Heads" : "Tails";
  const quips = isHeads
    ? [":party_parrot: Heads never fails!", ":sparkles: Clean flip!", ":tada: Heads it is!"]
    : [":dino-dance: Tails never fails!", ":sparkles: Landed on Tails!", ":tada: Tails!"];
  const quip = quips[Math.floor(Math.random() * quips.length)];
  await respond({ text: `:coin: *Coin Flip:* *${result}* — _${quip}_` });
});


app.command("/fiyan-dice", async ({ ack, respond, command }) => {
  await ack();
  const text = command.text?.trim().toLowerCase() || "d6";
  const match = text.match(/^(\d+)?d?(\d+)$/i);

  let count = 1;
  let sides = 6;

  if (match) {
    count = match[1] ? parseInt(match[1], 10) : 1;
    sides = parseInt(match[2], 10);
  }

  if (count < 1 || count > 20) {
    await respond({ text: ":warning: You can only roll between 1 and 20 dice at a time!" });
    return;
  }
  if (sides < 2 || sides > 1000) {
    await respond({ text: ":warning: Dice must have between 2 and 1000 sides!" });
    return;
  }

  const rolls = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }

  if (count === 1) {
    await respond({ text: `:game_die: *Dice Roll (d${sides}):* *${rolls[0]}*` });
  } else {
    await respond({
      text: `:game_die: *Dice Roll (${count}d${sides}):* [${rolls.join(", ")}] = :party_parrot: *${total}*`
    });
  }
});


app.command("/fiyan-uselessfact", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://uselessfacts.jsph.pl/api/v2/facts/random");
    const fact = response.data?.text || "No fact found.";
    await respond({ text: `:sparkles: *Useless Fact:*\n${fact}` });
  } catch (err) {
    console.error("uselessfact error:", err.message || err);
    await respond({ text: ":exploding_head: Ran out of useless facts for a second!" });
  }
});


app.command("/fiyan-meme", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://meme-api.com/gimme");
    const data = response.data;
    if (data.nsfw) {
      await respond({ text: ":popcat: Couldn't find a safe meme right now, try again!" });
      return;
    }
    await respond({
      text: `:popcat: *${data.title}* _(r/${data.subreddit})_\n${data.url}`
    });
  } catch (err) {
    console.error("meme error:", err.message || err);
    await respond({ text: ":x: Failed to fetch a meme right now. Try again later!" });
  }
});


app.command("/fiyan-rss", async ({ ack, respond, command }) => {
  await ack();

  const rawInput = command.text?.trim() || "";
  const parts = rawInput.split(/\s+/);
  const action = parts[0]?.toLowerCase();

  const presets = {
    hackclub: "https://scrapbook.hackclub.com/feed.xml",
    hackernews: "https://hnrss.org/frontpage",
    github: "https://github.blog/feed/"
  };

  // 1. List feeds
  if (!rawInput || action === "list") {
    if (feeds.length === 0) {
      await respond({
        text: ":newspaper: *RSS Status:*\nNo RSS feeds are being watched yet.\n\nUse `/fiyan-rss <url>` to add one, or try `/fiyan-rss hackernews`!"
      });
      return;
    }

    const feedList = feeds
      .map((f, i) => `${i + 1}. *${f.title || "Feed"}* - <${f.url}>`)
      .join("\n");

    await respond({
      text: `:newspaper: *Your Watched Feeds (${feeds.length}):* :satellite:\n${feedList}\n\n_Tip: Use \`/fiyan-rss read <number>\` to read top stories, \`/fiyan-rss remove <number>\` to delete, or \`/fiyan-rss check\` to refresh now._`
    });
    return;
  }

  // 2. Read latest posts on-demand
  if (action === "read" || action === "latest") {
    const target = parts[1] || "1";
    let targetUrl = presets[target.toLowerCase()] || "";
    let displayName = target;

    if (!targetUrl) {
      const num = parseInt(target, 10);
      if (!isNaN(num) && num >= 1 && num <= feeds.length) {
        targetUrl = feeds[num - 1].url;
        displayName = feeds[num - 1].title || feeds[num - 1].url;
      } else {
        const found = feeds.find((f) => f.url.toLowerCase() === target.toLowerCase());
        if (found) {
          targetUrl = found.url;
          displayName = found.title || found.url;
        }
      }
    }

    if (!targetUrl) {
      await respond({
        text: `:warning: Couldn't find feed "${target}". Use \`/fiyan-rss list\` to see your feed numbers, or try \`/fiyan-rss read hackernews\`!`
      });
      return;
    }

    try {
      const data = await parser.parseURL(targetUrl);
      const items = (data.items || []).slice(0, 3);
      if (items.length === 0) {
        await respond({ text: `:satellite: No articles found in *${displayName}*.` });
        return;
      }

      const articles = items.map((it, idx) => {
        const t = it.title || "Untitled";
        const l = it.link || targetUrl;
        const snip = it.contentSnippet ? `\n>${it.contentSnippet.slice(0, 120).replace(/\n/g, " ")}...` : "";
        return `*${idx + 1}.* <${l}|${t}>${snip}`;
      }).join("\n\n");

      await respond({
        text: `:newspaper: *Latest stories from ${data.title || displayName}:*\n\n${articles}`
      });
    } catch (err) {
      console.error(`Read error for ${targetUrl}:`, err.message || err);
      await respond({ text: `:x: Failed to read feed *${displayName}*.` });
    }
    return;
  }

  // 3. Remove feed (by index or url)
  if (action === "remove" || action === "delete") {
    const target = parts[1];
    if (!target) {
      await respond({ text: ":warning: Usage: `/fiyan-rss remove <number or url>`" });
      return;
    }

    let removeIndex = -1;
    const num = parseInt(target, 10);
    if (!isNaN(num) && num >= 1 && num <= feeds.length) {
      removeIndex = num - 1;
    } else {
      removeIndex = feeds.findIndex((f) => f.url.toLowerCase() === target.toLowerCase());
    }

    if (removeIndex === -1) {
      await respond({ text: `:warning: Couldn't find feed "${target}". Use \`/fiyan-rss list\` to see valid numbers!` });
      return;
    }

    const removed = feeds.splice(removeIndex, 1)[0];
    saveFeeds(feeds);
    await respond({ text: `:wastebasket: Removed feed: *${removed.title || removed.url}*` });
    return;
  }

  // 4. Manual check / refresh
  if (action === "check" || action === "refresh") {
    if (feeds.length === 0) {
      await respond({ text: ":newspaper: No RSS feeds to check. Add one with `/fiyan-rss <url>`." });
      return;
    }

    const results = [];
    for (const feed of feeds) {
      try {
        const data = await parser.parseURL(feed.url);
        if (!data.items || data.items.length === 0) {
          results.push(`:satellite: *${feed.title || feed.url}*\nNo posts found.`);
          continue;
        }

        const item = data.items[0];
        const title = item.title || "Untitled";
        const link = item.link || "No link found";

        if (title === feed.lastTitle) {
          results.push(`:satellite: *${feed.title || feed.url}*\n:white_check_mark: All caught up! Latest: <${link}|${title}>`);
        } else {
          feed.lastTitle = title;
          saveFeeds(feeds);
          results.push(`:satellite: *${feed.title || feed.url}*\n:party_parrot: *New Post:* <${link}|${title}>`);
        }
      } catch (err) {
        console.error(`Manual check error for ${feed.url}:`, err.message || err);
        results.push(`:x: Failed to check *${feed.title || feed.url}*`);
      }
    }

    await respond({ text: results.join("\n\n") });
    return;
  }

  // 5. Add feed (URL or preset)
  let feedUrl = presets[action] || "";
  if (!feedUrl) {
    const matchUrl = rawInput.match(/https?:\/\/[^\s>|]+/i);
    feedUrl = matchUrl ? matchUrl[0] : "";
  }

  if (!feedUrl) {
    const num = parseInt(rawInput, 10);
    if (!isNaN(num) && num >= 1 && num <= feeds.length) {
      const removed = feeds.splice(num - 1, 1)[0];
      saveFeeds(feeds);
      await respond({ text: `:wastebasket: Removed feed: *${removed.title || removed.url}*` });
      return;
    }

    await respond({
      text: ":warning: Please provide a valid RSS URL or preset.\n\n*Usage:*\n• `/fiyan-rss` - View watched feeds\n• `/fiyan-rss <url>` - Add a feed\n• `/fiyan-rss read <number>` - Read top 3 stories\n• `/fiyan-rss remove <number>` - Remove a feed\n• `/fiyan-rss check` - Check feeds now\n• `/fiyan-rss hackernews` - Quick-add Hacker News"
    });
    return;
  }

  const existing = feeds.find((f) => f.url.toLowerCase() === feedUrl.toLowerCase());
  if (existing) {
    await respond({
      text: `:warning: You are already watching *${existing.title || existing.url}*! Use \`/fiyan-rss remove <number>\` if you want to remove it.`
    });
    return;
  }

  try {
    const data = await parser.parseURL(feedUrl);
    const feedTitle = data.title || feedUrl;
    const latestItem = data.items && data.items.length > 0 ? data.items[0] : null;
    const latestTitle = latestItem?.title || "";
    const latestLink = latestItem?.link || "";

    const feed = {
      url: feedUrl,
      title: feedTitle,
      lastTitle: latestTitle,
      channelId: command.channel_id || ""
    };

    feeds.push(feed);
    saveFeeds(feeds);

    if (latestItem) {
      await respond({
        text: `:tada: *Added RSS Feed:* *${feedTitle}*\n:newspaper: *Latest Post:* <${latestLink}|${latestTitle}>`
      });
    } else {
      await respond({
        text: `:tada: *Added RSS Feed:* *${feedTitle}*\nNo posts found in this feed yet.`
      });
    }
  } catch (err) {
    console.error(`Add feed error for ${feedUrl}:`, err.message || err);
    await respond({
      text: `:x: Couldn't parse <${feedUrl}> as an RSS feed. Make sure the URL points to a valid XML/RSS feed!`
    });
  }
});


(async () => {
  await app.start();
  console.log("bot is running!");
})();
