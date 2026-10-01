# Knowfiyan 🤖

Knowfiyan is a Slack bot that monitors RSS feeds for you and brings updates right into your Slack channels, with persistent storage so your feeds never get lost.

## Features & Commands

### 📰 RSS Feed Monitor
* `/fiyan-rss` - Check status of all watched RSS feeds manually.
* `/fiyan-rss <url>` - Add a new RSS feed to watch (or remove an existing one).
* **Persistent Storage**: All feeds and latest posts are automatically saved to `feeds.json` so your feeds stay saved even if the bot restarts!
* **Auto Updates**: By default, the bot checks all feeds in the background every 60 seconds and notifies your channel when a new post drops.

### 🎮 Fun & Utility Commands
* 🏓 `/fiyan-ping` - Test the bot's latency
* 🐱 `/fiyan-catfact` - Get a random cat fact
* 📢 `/fiyan-echo <text>` - Echo a message
* 📖 `/fiyan-fakeword` - Get an AI-generated fake word with definition
* 😂 `/fiyan-joke` - Tell a random joke
* 💡 `/fiyan-advice` - Get a piece of random advice
* 🪙 `/fiyan-coin` - Flip a coin (Heads or Tails)
* 🎲 `/fiyan-dice [sides]` - Roll a dice (default 6-sided, or custom)
* 🧠 `/fiyan-uselessfact` - Get a random useless fact
* 🐸 `/fiyan-meme` - Grab a safe meme from Reddit
* 🤖 `/fiyan-help` - Show all commands in Slack

## What can you use it for?
Anything with an RSS feed!
* Tech blogs & news (e.g. Hacker News `https://hnrss.org/frontpage`)
* Gaming news & releases
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
