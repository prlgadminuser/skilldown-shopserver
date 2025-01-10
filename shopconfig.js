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

const itemPrefixes = ["A", "B", "A", "B", "A", "B", "I", "P"];

const maxrotationcounter = 5;

// Updated structure with startDate and endDate
const userFriendlyDateConfig = [
  {
    startDate: "11-19", // Start date
    endDate: "11-25",   // End date
    items: [
      { id: "I006", price: "250", currency: "gems", offertext: "TRICK OR TREAT BANNER!", theme: "3" },
      { id: ["A038", "B029"], price: "300", currency: "gems", offertext: "SKILLEDWEEN OFFER", normalprice: "350", theme: "3" },
    ],
    theme: "halloween"
  },
  {
    startDate: "1-1", // Start date
    endDate: "12-24",   // Same end date
    items: [
      { id: "A033", price: "400", currency: "gems", offertext: "NEW OFFER IN HALLOWEEN", theme: "3" },
    ],
    theme: "halloween"
  }
];

// Helper function to check if a date is within a range
function isDateInRange(date, startDate, endDate) {
  // We simply compare the strings "MM-DD" format directly
  return date >= startDate && date <= endDate;
}

// Generate specialDateConfig and specialDateTheme from the combined structure
const specialDateConfig = userFriendlyDateConfig.reduce((acc, { startDate, endDate, items }) => {
  if (!acc[startDate]) {
    acc[startDate] = [];
  }

  const newItems = items.map(({ id, price, currency, normalprice, offertext, theme, quantity}) => {
    const getItemPriceSafe = (id) => getItemPrice(id) ?? 0;

    const itemIds = Array.isArray(id) ? id : [id];
    const combinedNormalPrice = itemIds.reduce((total, itemId) => total + getItemPriceSafe(itemId), 0);

    const item = {
      itemId: id,
      price: price ?? combinedNormalPrice,
      quantity: quantity || 1, // Quantity added for box purchases
      currency: currency || "coins",
      offertext: offertext || "NEW ITEM",
      offerid: Math.random().toString(36).substring(2, 7),
       ...(theme != null && { theme }),
    };

    if (item.price !== combinedNormalPrice) {
      item.normalprice = normalprice ?? combinedNormalPrice;
    }

    return item;
  });

  // Add the new items to the existing list for the same date range
  acc[startDate] = [...acc[startDate], ...newItems];
  return acc;
}, {});

const specialDateTheme = userFriendlyDateConfig.reduce((acc, { startDate, theme }) => {
  acc[startDate] = theme;
  return acc;
}, {});

// Exporting the updated module
module.exports = {
  itemPrefixes,
  specialDateConfig,
  specialDateTheme,
  maxrotationcounter,
  isDateInRange,
};
