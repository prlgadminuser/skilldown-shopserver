const fs = require('fs');

const priceFilePath = "items.txt";
function loadItemPrices() {
  try {
    const fileData = fs.readFileSync(priceFilePath, "utf8");
    const items = fileData.split("\n").map(item => item.trim()).filter(Boolean);

    const itemPrices = new Map();
    items.forEach(item => {
      const [itemId, price] = item.split(":");
      if (itemId && price) {
        itemPrices.set(itemId, parseInt(price, 10));
      }
    });

    return itemPrices;
  } catch (err) {
    console.error("Error reading item prices from file:", err);
    return new Map();
  }
}

// Initialize item prices
const itemPrices = loadItemPrices();

// Function to get the price for an item
function getItemPrice(itemId) {
return itemPrices.get(itemId) || null;
}
// Function to get the price for an item
const itemPrefixes = ["A", "B", "A", "B", "A", "B", "I", "P"];

const maxrotationcounter = 6;

// Updated structure to include itemOfferName
const userFriendlyDateConfig = [
  {
    date: "9-2", // Christmas
    items: [
      { id: "A024", offertext: "Holiday Special" },
      { id: "B021", offertext: "Christmas Deal" },
      { id: "A013" },
      { id: "B010" },
      { id: "A017" },
      { id: "B014" }
    ],
    theme: "christmas"
  },
  {
    date: "9-17", // Halloween
    items: [
      { id: "I014", price: 56, offertext: "SPECIAL OFFER" },
      { id: "B027", price: 96 },
      { id: "A037", price: 488 },
      { id: "B028" },
      { id: "P009", price: 2, offertext: "5 MILLION TAKEDOWN REWARD!" },
      { id: "B005" }
    ],
    theme: "partytime"
  },
  {
    date: "10-4", // Partytime
    items: [
      { id: "I007" },
      { id: "I005" },
      { id: "I003" },
      { id: "I002" },
      { id: "I008" },
      { id: "I009" },
      { id: "I001" },
      { id: "I004" }
    ],
    theme: "partytime"
  },
  // Add additional date configurations as needed
];

// Generate specialDateConfig and specialDateTheme from the combined structure
const specialDateConfig = userFriendlyDateConfig.reduce((acc, { date, items }) => {
  acc[date] = items.map(({ id, price, normalprice, offertext, theme }) => {
    const getItemPriceSafe = (id) => getItemPrice(id) ?? 0;

    const item = {
      itemId: id,
      price: price ?? getItemPriceSafe(id),
      offertext: offertext || "NEW ITEM",
      theme: theme || undefined,
    };

    if (item.price !== getItemPriceSafe(id)) {
      item.normalprice = normalprice ?? getItemPriceSafe(id);
    }

    return item;
    });
  
  return acc;
}, {});

const specialDateTheme = userFriendlyDateConfig.reduce((acc, { date, theme }) => {
  acc[date] = theme;
  return acc;
}, {});



module.exports = {
  itemPrefixes,
  specialDateConfig,
  specialDateTheme,
  maxrotationcounter,
};



