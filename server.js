// Local development server for MongoDB API
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

let cachedClient = null;

async function connectToDatabase(mongoUri) {
  try {
    if (cachedClient) {
      return cachedClient.db('kumari_foods');
    }

    const client = new MongoClient(mongoUri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    console.log('✅ Connected to MongoDB');
    cachedClient = client;
    return cachedClient.db('kumari_foods');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw new Error('Failed to connect to MongoDB');
  }
}

app.post('/api/mongo', async (req, res) => {
  try {
    const mongoUri = req.headers['x-mongodb-uri'];

    if (!mongoUri) {
      return res.status(400).json({ error: 'Missing MongoDB URI' });
    }

    const db = await connectToDatabase(mongoUri);
    const { action, collection, data, filter } = req.body;

    if (!action || !collection) {
      return res.status(400).json({ error: 'Missing action or collection' });
    }

    const col = db.collection(collection);

    switch (action) {
      case 'find': {
        const documents = await col.find(filter || {}).toArray();
        return res.status(200).json({ documents });
      }

      case 'findOne': {
        const document = await col.findOne(filter || {});
        return res.status(200).json({ document });
      }

      case 'insertOne': {
        const insertResult = await col.insertOne(data);
        return res.status(201).json({ insertedId: insertResult.insertedId });
      }

      case 'updateOne': {
        const updateResult = await col.updateOne(
          filter || {},
          { $set: data },
          { upsert: true }
        );
        return res.status(200).json({
          modifiedCount: updateResult.modifiedCount,
          upsertedId: updateResult.upsertedId
        });
      }

      case 'deleteOne': {
        const deleteResult = await col.deleteOne(filter || {});
        return res.status(200).json({ deletedCount: deleteResult.deletedCount });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('API Error:', error.message);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Local MongoDB API server running on http://localhost:${PORT}`);
  console.log('📝 Use this when running locally with: npm run dev:server');
});
