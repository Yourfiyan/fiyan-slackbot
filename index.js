require("dotenv").config();
const { App } = require("@slack/bolt");
const axios = require("axios");


const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});


app.command("/fiyan-ping", async ({ ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/fiyan-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text: "*Available Commands:*\n`/fiyan-ping` - Test bot latency\n`/fiyan-catfact` - Get a random cat fact\n`/fiyan-echo` - Echo a message\n`/fiyan-fakeword` - Get a fake word\n`/fiyan-joke` - Tell a random joke"
  });
});


app.command("/fiyan-catfact", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `*Cat Fact:*\n${response.data.fact}` });
  } catch (err) {
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
    const response = await axios.get("https://www.thisworddoesnotexist.com/");
    const match = response.data.match(/JSON\.parse\("(\{.*?\})"\)/);
    if (!match) {
      throw new Error("Failed to parse fake word");
    }
    const data = JSON.parse(JSON.parse(`"${match[1]}"`));
    const syllables = data.syllables && data.syllables.length > 1
      ? ` [${data.syllables.join("-")}]`
      : "";
    const cleanExample = data.example ? data.example.replace(/^"|"$/g, "").trim() : "";
    const exampleBlock = cleanExample ? `\n*Example:* _"${cleanExample}"_` : "";

    await respond({
      text: `*Fake Word:* *${data.word}*${syllables}\n*Part of Speech:* _${data.pos || "unknown"}_\n*Meaning:* ${data.definition}${exampleBlock}`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a fake word." });
  }
});

app.command("/fiyan-joke", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      text: `*Joke:*\n${response.data.setup}\n\n_${response.data.punchline}_`
    });
  } catch (err) {
    await respond({ text: "Failed to fetch a joke." });
  }
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();
