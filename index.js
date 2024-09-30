const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cron = require("node-cron");
const fs = require("fs");

const { specialDateConfig, itemPrefixes, specialDateTheme, maxrotationcounter } = require('./shopconfig.js');

const app = express();
exports.app = app;

const port = process.env.PORT || 3004;

process.on("SIGINT", function () {
  mongoose.connection.close(function () {
    console.log("Mongoose disconnected on app termination");
    process.exit(0);
  });
});

const password = process.env.DB_KEY || "8RLj5Vr3F6DRBAYc";
const encodedPassword = encodeURIComponent(password);

const uri = `mongodb+srv://Liquem:${encodedPassword}@cluster0.ed4zami.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    socketTimeoutMS: 30000,
  },
});

async function startServer() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}


const db = client.db("Cluster0");
const itemDataCollection = db.collection("item_data");
const PackItemsCollection = db.collection("packitems");
const shopcollection = db.collection("serverconfig");

async function getItemData() {
  const itemsData = fs.readFileSync("items.txt", "utf8");
  const lines = itemsData.split("\n");

  try {
    await itemDataCollection.deleteMany({});
    const itemsToInsert = lines
      .map((line) => {
        const [itemId, itemPrice] = line.split(":");
        const parsedItemPrice = parseInt(itemPrice);

        if (!isNaN(parsedItemPrice)) {
          return {
            _id: itemId,
            id: itemId,
            price: parsedItemPrice,
          };
        } else {
          console.error(`Invalid item price for item ${itemId}: ${itemPrice}`);
          return null;
        }
      })
      .filter((item) => item !== null);

    await itemDataCollection.insertMany(itemsToInsert);
    console.log("Items initialized successfully.");
  } catch (error) {
    console.error("Error initializing items:", error);
  }
}

// Call the asynchronous function
// getItemData();

async function getItemData2() {
  const itemsData = fs.readFileSync("packitems.txt", "utf8");
  const lines = itemsData.split("\n");

  try {
    await PackItemsCollection.deleteMany({});
    const itemsToInsert = lines
      .map((line) => {
        const [itemId, itemPrice] = line.split(":");
        const parsedItemPrice = parseInt(itemPrice);

        if (!isNaN(parsedItemPrice)) {
          return {
            id: itemId,
            price: parsedItemPrice,
          };
        } else {
          console.error(`Invalid item price for item ${itemId}: ${itemPrice}`);
          return null;
        }
      })
      .filter((item) => item !== null);

    await PackItemsCollection.insertMany(itemsToInsert);
    console.log("Items initialized successfully.");
  } catch (error) {
    console.error("Error initializing items:", error);
  }
}

// getItemData2();
// getItemData();

const itemsFilePath = "shopitems.txt";
const previousRotationFilePath = "previous-rotation.txt";
const lastUpdateTimestampFilePath = "last-update-timestamp.txt";
const pricefile = "items.txt";
let lastUpdateTimestamp = null;

function loadLastUpdateTimestamp() {
  try {
    const timestampData = fs.readFileSync(lastUpdateTimestampFilePath, "utf8");
    lastUpdateTimestamp = parseInt(timestampData);
  } catch (err) {
    console.error("Error reading last update timestamp:", err);
  }
}

function saveLastUpdateTimestamp() {
  try {
    fs.writeFileSync(lastUpdateTimestampFilePath, Date.now().toString());
  } catch (err) {
    console.error("Error saving last update timestamp:", err);
  }
}


function shouldUpdateDailyRotation() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);

  return now > midnight && lastUpdateTimestamp < midnight.getTime();
}

let availableItems = [];
let dailyItems = [];

function loadAvailableItems() {
  try {
    const fileData = fs.readFileSync(itemsFilePath, "utf8");
    availableItems = fileData
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    console.log("Available items updated.");
  } catch (err) {
    console.error("Error reading items from file:", err);
  }
}

function loadPreviousRotation() {
  try {
    const fileData = fs.readFileSync(previousRotationFilePath, "utf8");
    const lines = fileData.split("\n").filter((item) => item.trim() !== "");

    dailyItems = {};
    lines.forEach((line, index) => {
      dailyItems[(index + 1).toString()] = line.trim();
    });

    console.log("Previous daily rotation loaded.");
  } catch (err) {
    console.error("Error reading previous daily rotation from file:", err);
  }
}

function load1PreviousRotation() {
  try {
    const data = fs.readFileSync("previous-rotation.txt", "utf8");
    return data.split("\n").map((item) => item.trim());
  } catch (error) {
    console.error("Error reading previous rotation file:", error.message);
    return [];
  }
}

function saveDailyRotation() {
  try {
    const lines = Object.values(dailyItems);
    fs.writeFileSync(previousRotationFilePath, lines.join("\n"));
  } catch (err) {
    console.error("Error saving daily rotation to file:", err);
  }
}

const itemsUsedInLastDaysFilePath = "items-used-in-last-days.json";
const shopUpdateCounterFilePath = "shop-update-counter.json";

function getItemsUsedInLastDays() {
  try {
    const data = fs.readFileSync(itemsUsedInLastDaysFilePath, "utf8");
    return new Map(JSON.parse(data));
  } catch (error) {
    console.error("Error reading items used in last days file:", error.message);
    return new Map();
  }
}

function saveItemsUsedInLastDays(itemsUsedInLastDaysMap) {
  try {
    const data = JSON.stringify(Array.from(itemsUsedInLastDaysMap.entries()));
    fs.writeFileSync(itemsUsedInLastDaysFilePath, data);
  } catch (error) {
    console.error("Error saving items used in last days:", error.message);
  }
}

function getShopUpdateCounter() {
  try {
    const data = fs.readFileSync(shopUpdateCounterFilePath, "utf8");
    return parseInt(data) || 0;
  } catch (error) {
    console.error("Error reading shop update counter file:", error.message);
    return 0;
  }
}

function loadItemPrices() {
  try {
    const fileData = fs.readFileSync(pricefile, "utf8");
    const items = fileData
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const itemPrices = new Map();
    items.forEach((item) => {
      const { itemId, price } = parseItem(item);
      itemPrices.set(itemId, parseInt(price));
    });

    return itemPrices;
  } catch (err) {
    console.error("Error reading item prices from file:", err);
    return new Map();
  }
}

function parseItem(item) {
  const [itemId, price] = item.split(":");
  return { itemId, price };
}

function applyDiscount(items) {
  // Get an array of the item keys
  const itemKeys = Object.keys(items);

  // Determine how many items to discount (between 1 and 3)
  const numDiscounts = Math.floor(Math.random() * 3) + 1;

  // Shuffle the keys and pick the first 'numDiscounts' keys
  const discountKeys = itemKeys.sort(() => 0.5 - Math.random()).slice(0, numDiscounts);

  // Apply the discount
  discountKeys.forEach(key => {
      const item = items[key];
      const discountRate = 0.2; // 20% discount
      item.normalprice = item.price;
      item.price = Math.round(item.price * (1 - discountRate)); // Apply discount and round to nearest integer
      item.offertext = "SPECIAL OFFER";
  });

  return items;
}

function processDailyItemsAndSaveToServer() {
 

  const itemPrices = loadItemPrices();
  const dailyItemsWithPrices = Object.keys(dailyItems).reduce((result, key) => {
    const item = dailyItems[key];
    const { itemId } = parseItem(item);
    const price = itemPrices.get(itemId);
    result[key] = { itemId, price };
    return result;
  }, {});

  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateString = `${month}-${day}`;
  const theme = specialDateTheme[dateString] || undefined;

  const updatedItems = applyDiscount(dailyItemsWithPrices);

  const document = {
    items: updatedItems,
    theme: theme,
  };

  

  shopcollection.updateOne(
    { _id: "dailyItems" },
    { $set: document },
    { upsert: true }
  );
}

function processSpecialItemsAndSaveToServer() {
 
  
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateString = `${month}-${day}`;

  const specialItems = specialDateConfig[dateString];

  if (specialItems) {
    dailyItems = createKeyedItems(specialItems);
  
    saveDailyRotation();
    const document = {
      items: dailyItems,
      theme: specialDateTheme[dateString] || undefined,
    };

    shopcollection.updateOne(
      { _id: "dailyItems" },
      { $set: document },
      { upsert: true }
    );
  }
}

function incrementShopUpdateCounter() {
  const counter = getShopUpdateCounter() + 1;
  try {
    fs.writeFileSync(shopUpdateCounterFilePath, counter.toString());
  } catch (error) {
    console.error("Error incrementing shop update counter:", error.message);
  }
}

function selectDailyItems() {
  let shuffledItems = [...availableItems];
  dailyItems = {};
  const selectedItemsSet = new Set();

  const previousRotationMap = getItemsUsedInLastDays();
  const previousRotation = Array.from(previousRotationMap.keys());
  shuffledItems = shuffledItems.filter((item) => !previousRotation.includes(item));

  const shopUpdateCounter = getShopUpdateCounter();

  if (shopUpdateCounter > maxrotationcounter) {
    const itemsUsedInLastDaysMap = new Map();
    saveItemsUsedInLastDays(itemsUsedInLastDaysMap);
    fs.writeFileSync(shopUpdateCounterFilePath, "0");
  }

  const now = new Date();

  for (let i = 0; i < itemPrefixes.length; i++) {
    const prefix = itemPrefixes[i];
    const validItems = shuffledItems.filter(
      (item) => item.startsWith(prefix) && !selectedItemsSet.has(item),
    );

    if (validItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * validItems.length);
      let selectedItem = validItems[randomIndex];
      selectedItem = cleanUpItem(selectedItem);

      dailyItems[(i + 1).toString()] = selectedItem;
      selectedItemsSet.add(selectedItem);

      const indexToRemove = shuffledItems.indexOf(selectedItem);
      if (indexToRemove !== -1) {
        shuffledItems.splice(indexToRemove, 1);
      }

      const itemsUsedInLastDaysMap = getItemsUsedInLastDays();
      itemsUsedInLastDaysMap.set(selectedItem, now.getTime());
      saveItemsUsedInLastDays(itemsUsedInLastDaysMap);
    } else {
      console.error(`Not enough available items with prefix ${prefix}.`);
      return;
    }
  }

  saveDailyRotation();
  incrementShopUpdateCounter();
  processDailyItemsAndSaveToServer();
}

function cleanUpItem(item) {
  return item.replace(/\r/g, "");
}

function isSpecialDate() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  return specialDateConfig[`${month}-${day}`] !== undefined;
}

function setSpecialDailyItems() {
  if (isSpecialDate()) {
    processSpecialItemsAndSaveToServer();
  } else {
    selectDailyItems();
  }
}

function createKeyedItems(items) {
  const keyedItems = {};
  items.forEach((item, index) => {
    keyedItems[index + 1] = item;
  });
  return keyedItems;
}

function initializeItems() {
  loadAvailableItems();
  loadPreviousRotation();
  loadLastUpdateTimestamp();

  if (shouldUpdateDailyRotation()) {
    setSpecialDailyItems();
    saveLastUpdateTimestamp();
  }
}

startServer().then(() => {
  initializeItems();
}).catch(error => {
  console.error("Failed to connect to the database:", error);
});


cron.schedule(
  "0 0 * * *",
  () => {
    setSpecialDailyItems();
    saveLastUpdateTimestamp();
    console.log("Daily rotation updated.");
  },
  {
    scheduled: true,
    timezone: "UTC",
  }
);

const currentTimestamp = new Date().getTime();
console.log(currentTimestamp);


app.use((err, req, res, next) => {
  console.error('An error occurred:', err);
  res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
