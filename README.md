# Knowfiyan 🤖

Knowfiyan is a Hack Club Slack bot that monitors RSS feeds for you and brings updates right into your Slack channels, with persistent storage so your feeds never get lost.

## Features & Commands

### 📰 RSS Feed Monitor
* `/fiyan-rss` or `/fiyan-rss list` - View all watched RSS feeds with clean numbers and titles.
* `/fiyan-rss <url>` - Add a new RSS feed to watch.
* `/fiyan-rss remove <number>` - Remove a feed by its list number (e.g. `/fiyan-rss remove 1`).
* `/fiyan-rss check` - Manually check all feeds for new articles right now.
* `/fiyan-rss hackernews` - Quick-add Hacker News frontpage feed.
* `/fiyan-rss hackclub` - Quick-add Hack Club Scrapbook feed.
* **Persistent Storage**: All feeds and latest posts are automatically saved to `feeds.json` so your feeds stay saved even if the bot restarts!
* **Auto Updates**: By default, the bot checks all feeds in the background every 60 seconds and notifies your channel when a new post drops.

### 🎮 Fun & Utility Commands
* 🏓 `/fiyan-ping` - Test bot latency with speed comments
* 🐸 `/fiyan-meme` - Grab a safe meme from Reddit
* 🎲 `/fiyan-dice [count]d[sides]` - Roll tabletop dice (e.g. `d20`, `2d6`, `3d8`)
* 🪙 `/fiyan-coin` - Flip a coin with commentary
* 📢 `/fiyan-echo <text>` - Echo a message (try `/fiyan-echo yell hello` or `/fiyan-echo reverse hello`)
* 🐱 `/fiyan-catfact` - Get a random cat fact
* 😂 `/fiyan-joke` - Tell a random joke
* 💡 `/fiyan-advice` - Get a piece of random advice
* 📖 `/fiyan-fakeword` - Get an AI-generated fake word with definition
* 🧠 `/fiyan-uselessfact` - Get a random useless fact
* 🤖 `/fiyan-help` - Show all commands in Slack

## What can you use it for?
Anything with an RSS feed!
* Tech blogs & news (e.g. Hacker News `https://hnrss.org/frontpage`)
* Hack Club Scrapbook updates (`https://scrapbook.hackclub.com/feed.xml`)
* Subreddit RSS feeds (`https://www.reddit.com/r/hackclub/.rss`)
* Personal developer blogs

## Setup & Running Locally

1. Clone this repo:
   ```bash
   git clone https://github.com/Yourfiyan/fiyan-slackbot.git
   cd fiyan-slackbot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (see `.env.example`):
   ```env
   SLACK_BOT_TOKEN=xoxb-...
   SLACK_APP_TOKEN=xapp-...
   SLACK_CHANNEL_ID=C...
   ```

4. Start the bot:
   ```bash
   npm start
   ```
