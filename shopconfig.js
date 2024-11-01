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
    date: "10-29", // Partytime
    items: [
      { id: "I006", price: "250", offertext: "TRICK OR TREAT BANNER!", theme: "3"  },
      { id: ["A038", "B029"], price: "300", offertext: "SKILLEDWEEN OFFER", normalprice: "350", theme: "3" },
    ],
    theme: "halloween"
  },
  
  
  {
    date: "10-30", 
    items: [
      { id: "I006", price: "250", offertext: "TRICK OR TREAT BANNER!", theme: "3"  },
      { id: ["A038", "B029"], price: "300", offertext: "SKILLEDWEEN OFFER", normalprice: "350", theme: "3" },
    ],
    theme: "halloween"
  },

  
  {
    date: "11-2", 
    items: [
       { id: "I006", price: "250", offertext: "TRICK OR TREAT BANNER!", theme: "3"  },
      { id: ["A033", "I013"], price: "300", offertext: "ARCADE SEASON RETURNS!", theme: "2" },
    ],
    theme: "halloween"
  },
  

];

// Generate specialDateConfig and specialDateTheme from the combined structure
const specialDateConfig = userFriendlyDateConfig.reduce((acc, { date, items }) => {
  acc[date] = items.map(({ id, price, normalprice, offertext, theme }) => {
    // Helper function to get the item price safely
    const getItemPriceSafe = (id) => getItemPrice(id) ?? 0;

    // If `id` is an array, calculate combined price
    const itemIds = Array.isArray(id) ? id : [id];
    const combinedNormalPrice = itemIds.reduce((total, itemId) => total + getItemPriceSafe(itemId), 0);

    const item = {
      itemId: id,
      price: price ?? combinedNormalPrice, // Use provided price or combined default price
      offertext: offertext || "NEW ITEM",
      ...(theme != null && { theme }),
    };

    // Set normalprice only if it differs from combined default price
    if (item.price !== combinedNormalPrice) {
      item.normalprice = normalprice ?? combinedNormalPrice;
    }

    return item;
  });

  return acc;
}, {});


module.exports = {
  itemPrefixes,
  specialDateConfig,
  specialDateTheme,
  maxrotationcounter,
};



