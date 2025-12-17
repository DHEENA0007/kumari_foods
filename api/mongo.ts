import { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, Db, Collection } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase(mongoUri: string): Promise<Db> {
  try {
    const client = new MongoClient(mongoUri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
    });
    
    await client.connect();
    cachedClient = client;
    cachedDb = client.db('kumari_foods');
    return cachedDb;
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-mongodb-uri');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    const col: Collection = db.collection(collection);

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
}
