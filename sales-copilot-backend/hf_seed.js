const { MongoClient } = require('mongodb');

// Paste your actual MongoDB string here
const client = new MongoClient(uri);

async function seedB2BData() {
  try {
    await client.connect();
    console.log("🟢 Connected to MongoDB Atlas!");

    const db = client.db('SalesCopilotDB');
    const collection = db.collection('SuccessfulConversations');

    // Clear out any old junk (like the hats and basketballs!)
    await collection.deleteMany({});
    console.log("🧹 Cleared old dataset.");

    console.log("⏳ Fetching REAL B2B Sales data from Hugging Face...");

    // Hitting the Hugging Face REST API for the exact dataset you found
    const apiUrl = "https://datasets-server.huggingface.co/rows?dataset=goendalf666%2Fsales-conversations-2&config=default&split=train&offset=0&length=100";

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Hugging Face API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const parsedCalls = [];

    // Loop through the data and format it
    for (const item of data.rows) {
      // This dataset usually stores the dialogue in a 'text' or 'dialogue' field
      // We will stringify the whole row object so Gemini has all the context it needs
      parsedCalls.push({
        callType: "B2B Software Sales",
        transcript: JSON.stringify(item.row)
      });
    }

    if (parsedCalls.length > 0) {
      const result = await collection.insertMany(parsedCalls);
      console.log(`✅ BOOM! Inserted ${result.insertedCount} real B2B sales conversations into Atlas.`);
    } else {
      console.log("⚠️ No data found from the API.");
    }

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error("🛑 Error:", error);
    process.exit(1);
  }
}

seedB2BData();