const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "feeds.json");

const loadFeeds = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.log(err);
    return [];
  }
};

const saveFeeds = (feeds) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(feeds, null, 2), "utf8");
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  loadFeeds,
  saveFeeds
};
