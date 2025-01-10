const fs = require('fs');

// Original price loading logic
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

// Utility function to generate all dates between start and end date
function generateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];
  
  while (start <= end) {
    dates.push(formatDate(start));
    start.setDate(start.getDate() + 1);
  }
  
  return dates;
}

// Format date to MM-DD format
function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

// Updated structure with startDate and endDate
const userFriendlyDateConfig = [
  {
    startDate: "11-19", // Partytime
    endDate: "11-19",
    items: [
      { id: "I006", price: "250", currency: "gems", offertext: "TRICK OR TREAT BANNER!", theme: "3" },
      { id: ["A038", "B029"], price: "300", currency: "gems", offertext: "SKILLEDWEEN OFFER", normalprice: "350", theme: "3" },
      { id: "5 Boxes A", price: "450", quantity: 5, currency: "gems", offertext: "Bulk purchase of 5 Box A", theme: "special_offer" },
    ],
    theme: "halloween"
  },
  {
    startDate: "10-30", 
    endDate: "10-30", 
    items: [
      { id: "I006", price: "250", offertext: "TRICK OR TREAT BANNER!", theme: "3" },
      { id: ["A038", "B029"], price: "300", offertext: "SKILLEDWEEN OFFER", normalprice: "350", theme: "3" },
    ],
    theme: "halloween"
  },
  {
    startDate: "11-23", 
    endDate: "11-23", 
    items: [
      { id: "I006", price: "250", offertext: "TRICK OR TREAT BANNER!", theme: "3" },
      { id: ["A033", "I013"], price: "300", offertext: "ARCADE SEASON RETURNS!", theme: "2" },
    ],
    theme: "halloween"
  },
  {
    startDate: "1-4", 
    endDate: "1-14", 
    items: [
      { id: "A027", price: "90", offertext: "2025 NEW YEAR OFFER!", theme: "2" },
    ],
    theme: "partytime"
  },
];

// Generate specialDateConfig and specialDateTheme from the combined structure
const specialDateConfig = userFriendlyDateConfig.reduce((acc, { startDate, endDate, items }) => {
  const dateRange = generateDateRange(startDate, endDate);

  dateRange.forEach(date => {
    if (!acc[date]) acc[date] = [];

    items.forEach(({ id, price, currency, normalprice, offertext, theme, quantity}) => {
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

      acc[date].push(item);
    });
  });

  return acc;
}, {});

const specialDateTheme = userFriendlyDateConfig.reduce((acc, { startDate, endDate, theme }) => {
  const dateRange = generateDateRange(startDate, endDate);

  dateRange.forEach(date => {
    acc[date] = theme;
  });

  return acc;
}, {});

// Exporting the updated module
module.exports = {
  itemPrefixes,
  specialDateConfig,
  specialDateTheme,
  maxrotationcounter,
};


