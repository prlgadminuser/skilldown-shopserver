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

  // Calculate the max range of 2 additional days before and after the start date
  const rangeStartDate = new Date(start);
  rangeStartDate.setDate(start.getDate() - 2);  // Subtract 2 days from start date
  
  const rangeEndDate = new Date(start);
  rangeEndDate.setDate(start.getDate() + 2);    // Add 2 days to start date

  // Use the minimum of the actual endDate and the calculated rangeEndDate
  const finalEndDate = end < rangeEndDate ? end : rangeEndDate;
  
  const dates = [];

  // Generate the dates between rangeStartDate and finalEndDate
  while (rangeStartDate <= finalEndDate) {
    dates.push(formatDate(rangeStartDate));  // Use formatDate to get the proper format
    rangeStartDate.setDate(rangeStartDate.getDate() + 1);  // Move to the next day
  }
  
  return dates;
}



// Format date to MM-DD format
function formatDate(date) {
  const month = date.getMonth() + 1; // No padding
  const day = date.getDate(); // No padding
  return `${month}-${day}`;
}


// Updated structure with startDate and endDate
const userFriendlyDateConfig = [
  {
    startDate: "1-1",  // Start of the year
    endDate: "12-31",    // End of the year
    items: [
      { id: ["A001", "A002"], price: "0", currency: "coins", offertext: "STARTER PACK", normalprice: "350", theme: "2" },
    ],
    theme: "default"
  },
  {
    startDate: "10-28", 
    endDate: "11-1", 
    items: [
      { id: "I006", price: "250", offertext: "TRICK OR TREAT BANNER!", theme: "3" },
      { id: ["A038", "B029"], price: "300", offertext: "SKILLEDWEEN OFFER", normalprice: "350", theme: "3" },
    ],
    theme: "default"
  },
  {
    startDate: "1-4", 
    endDate: "1-14", 
    items: [
      { id: "A027", price: "90", offertext: "2025 NEW YEAR OFFER!", theme: "2" },
    ],
    theme: "default"
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


