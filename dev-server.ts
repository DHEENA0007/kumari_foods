// Local development server for API
import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const app: express.Application = express();
app.use(cors());
app.use(express.json());

const COMPANIES_COLLECTION = 'companies';
const SCHEDULES_COLLECTION = 'schedules';

async function connectToDatabase(mongoUri: string) {
  try {
    const client = new MongoClient(mongoUri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
    });
    
    await client.connect();
    const db = client.db('kumari_foods');
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

app.post('/api/mongo', async (req, res) => {
  try {
    // Get MongoDB URI from header
    const mongoUri = req.headers['x-mongodb-uri'] as string;
    
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
      case 'find':
        const documents = await col.find(filter || {}).toArray();
        return res.status(200).json({ documents });

      case 'findOne':
        const document = await col.findOne(filter || {});
        return res.status(200).json({ document });

      case 'insertOne':
        const insertResult = await col.insertOne(data);
        return res.status(201).json({ insertedId: insertResult.insertedId });

      case 'insertMany':
        const insertManyResult = await col.insertMany(data);
        return res.status(201).json({ insertedIds: insertManyResult.insertedIds });

      case 'updateOne':
        const updateResult = await col.updateOne(
          filter || {},
          { $set: data },
          { upsert: true }
        );
        return res.status(200).json({
          modifiedCount: updateResult.modifiedCount,
          upsertedId: updateResult.upsertedId
        });

      case 'deleteOne':
        const deleteResult = await col.deleteOne(filter || {});
        
        // If deleting a company, also delete its associated schedule
        if (collection === COMPANIES_COLLECTION && filter?.id) {
          await db.collection(SCHEDULES_COLLECTION).deleteOne({ companyId: filter.id });
          console.log(`🗑️  Deleted company ${filter.id} and its schedule from MongoDB`);
        }
        
        return res.status(200).json({ deletedCount: deleteResult.deletedCount });

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 MongoDB API server running on http://localhost:${PORT}`);
  console.log('📝 Use this with: npm run dev (in another terminal)');
});
