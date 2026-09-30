# ⚡ Knowfiyan

> A friendly Slack bot that watches RSS feeds and posts automatic updates right to your channel. Built for Hack Club!

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![Slack Bolt](https://img.shields.io/badge/Slack-Bolt%20v5-4A154B?style=flat&logo=slack&logoColor=white)](https://slack.dev/bolt-js/)
[![Socket Mode](https://img.shields.io/badge/Socket%20Mode-Enabled-007acc?style=flat)]()
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

---

## ✨ Features

- 🔄 **Periodic RSS Polling** — Checks your feeds in the background every 60 seconds and drops new articles directly into your channel.
- 📚 **Multi-Feed Support** — Track multiple RSS feeds at once. Add or remove feeds simply by running the command with the URL.
- 🎯 **Channel-Aware** — Remembers the channel where you added a feed and posts new updates there.
- 🛠️ **Handy & Fun Commands** — Ping latency checker, random jokes, cat facts, echo, and made-up words.

---

## 🤖 Commands

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/fiyan-rss` | `[optional url]` | Check status of feeds, or add / remove an RSS feed |
| `/fiyan-help` | _none_ | List all available bot commands |
| `/fiyan-ping` | _none_ | Test bot socket latency in milliseconds |
| `/fiyan-catfact` | _none_ | Fetch a random cat fact |
| `/fiyan-joke` | _none_ | Grab a random programming or dad joke |
| `/fiyan-fakeword` | _none_ | Get a made-up word with definition and example |
| `/fiyan-echo` | `<message>` | Echoes back whatever message you send |

---

## 🚀 How `/fiyan-rss` Works

### 1. Add a feed
Add any valid RSS or Atom feed link:
```text
/fiyan-rss https://news.ycombinator.com/rss
```
> Knowfiyan will verify the feed, fetch the latest post, and remember the channel for future updates!

### 2. Automatic updates
Every 60 seconds, Knowfiyan scans all active feeds. When a new post drops, it sends a notification right to the channel:
```text
*New RSS Update:*
*Feed:* <https://news.ycombinator.com/rss>
*Latest Post:* <https://news.ycombinator.com/item?id=...|Show HN: My New Project>
```

### 3. Check status manually
Run `/fiyan-rss` with no arguments to see the latest post from every feed you're watching:
```text
/fiyan-rss
```

### 4. Remove a feed
Want to stop watching a feed? Just run `/fiyan-rss <url>` again with the same link to toggle it off:
```text
/fiyan-rss https://news.ycombinator.com/rss
```

---

## 💡 What can you watch?

Basically anything that outputs an RSS or Atom feed:
- 📰 Tech & World News (Hacker News, BBC, Ars Technica)
- 🎮 Gaming & Community blogs (Minecraft, Steam, GitHub Blog)
- 📝 Personal blogs & Substack newsletters
- 🏫 Club announcements & release feeds

---

## 🛠️ Setup & Running Locally

### 1. Clone & Install
```bash
git clone https://github.com/Yourfiyan/fiyan-slackbot.git
cd fiyan-slackbot
npm install
```

### 2. Configure Environment
Create a `.env` file in the root folder:
```env
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_APP_TOKEN=xapp-your-app-level-token-here
SLACK_CHANNEL_ID=C0123456789 # optional fallback channel
```

### 3. Start the Bot
```bash
npm start
```
Once connected in Socket Mode, you'll see:
```text
bot is running!
```

---

## 📦 Built With

- **[@slack/bolt](https://github.com/slackapi/bolt-js)** — Slack bot framework in Socket Mode
- **[rss-parser](https://github.com/rbren/rss-parser)** — Fast XML & RSS feed parsing
- **[axios](https://github.com/axios/axios)** — HTTP client for API commands
- **[dotenv](https://github.com/motdotla/dotenv)** — Environment variable configuration

---

## 📄 License

[ISC](https://opensource.org/licenses/ISC) © Syed Sufiyan Hamza
