# Knowfiyan 

Knowfiyan is a simple Slack bot that keeps an eye on an RSS feed for you.

When the feed gets updated, you can use:

```text
/fiyan-rss
```

to check for new updates. By default, the bot will check the feed every 60 seconds. You can change this by modifying the `checkInterval` variable in the code.

Use 

```text
/fiyan-rss <new url>
```

to add a new RSS feed.

Use

```text
/fiyan-rss <existing url>
```

to remove an RSS feed.

## What can you use it for?

Well anything that has an RSS feed lol.

*  News websites
*  Tech blogs
*  Gaming news
*  Blog updates
*  Any other RSS feed

## How it works

1. Add an RSS feed to Knowfiyan.
2. Knowfiyan keeps checking it.
3. When something new appears, it remembers it.
4. Run `/fiyan-rss` in Slack to check for updates manually.

That's it- 
Well at least for the main command 

## Rest of the commands are as follows:

```text
/fiyan-help       - Help Command
/fiyan-ping       - Test the bot's latency
/fiyan-catfact    - Get a random cat fact
/fiyan-echo       - Echo a message
/fiyan-fakeword   - Get a random fake word
/fiyan-joke       - Tell a random joke
```
