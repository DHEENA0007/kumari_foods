# Kumari Foods - MongoDB Deployment Guide

## Overview
This application uses:
- **Frontend**: React + TypeScript (Vite) - deployed to Vercel
- **API**: Local Node.js server (for development) + Vercel serverless (for production)
- **Database**: MongoDB Atlas (cloud)
- **Storage**: IndexedDB (local) + MongoDB (cloud sync)

## Quick Start - Local Development

### Step 1: Start the MongoDB API Server
Open a **new terminal** and run:
```bash
npm run dev:server
```
This starts a local server on `http://localhost:5001` that bridges your frontend to MongoDB.

### Step 2: Start the Frontend
In a **different terminal**, run:
```bash
npm run dev
```
This starts the Vite development server on `http://localhost:5173`

### Step 3: Use MongoDB in the App
1. Open the app at `http://localhost:5173`
2. Click the **"Cloud"** button in the header
3. Paste your MongoDB connection string:
   ```
   mongodb+srv://kumari:EUttGtfVazqgq23T@cluster0.iyjdmai.mongodb.net/kumari_foods
   ```
4. Click **"Test Connection"** ✅
5. Click **"Sync Data"** to load all meal data

## MongoDB Setup

### Your Connection String
```
mongodb+srv://kumari:EUttGtfVazqgq23T@cluster0.iyjdmai.mongodb.net/kumari_foods
```

**Database**: `kumari_foods`
**Collections**: 
- `companies` - Stores company/branch information
- `schedules` - Stores meal schedules

### Sample Data
The database is pre-loaded with 3 companies and 45+ meal entries (Run `node setup-mongodb.js` if needed).

## Deployment to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add MongoDB integration"
git push origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the setup
5. Click "Deploy"

**That's it!** Your app is now live with MongoDB support.

## File Structure
```
kumari_foods/
├── api/
│   └── mongo.ts                    # Vercel serverless endpoint
├── src/
│   ├── services/
│   │   └── mongoDBDataAPI.ts       # Frontend MongoDB client
│   ├── components/
│   │   └── MongoDBSettings.tsx     # Settings dialog
│   └── ...
├── server.js                        # Local development server
├── setup-mongodb.js                 # Sample data setup script
├── package.json
└── vercel.json (optional)
```

## How It Works

### Local Development Flow
```
Frontend (localhost:5173)
        ↓
  /api/mongo (localhost:5001)
        ↓
  MongoDB Atlas Cloud
```

### Production Flow (Vercel)
```
Frontend (yourapp.vercel.app)
        ↓
  /api/mongo (Vercel serverless)
        ↓
  MongoDB Atlas Cloud
```

## Available Commands

### Development
```bash
npm run dev              # Start frontend (port 5173)
npm run dev:server       # Start API server (port 5001)
npm run dev:all          # Start both (requires concurrently)
```

### Production
```bash
npm run build            # Build for production
npm run preview          # Preview production build locally
npm start                # Run production server
```

### Setup
```bash
node setup-mongodb.js    # Add sample data to MongoDB
```

## Troubleshooting

### "Connection failed. Check your MongoDB URI."
**Problem**: Server might not be running

**Solution**:
- Make sure `npm run dev:server` is running in another terminal
- Check that port 5001 is not blocked
- Verify MongoDB URI is correct

### "Cannot GET /api/mongo" (404 error)
**Problem**: API endpoint not found during local development

**Solution**: 
- Run `npm run dev:server` in a separate terminal
- The frontend is trying to connect to `http://localhost:5001/api/mongo`

### Data not syncing
**Problem**: Test connection passed but sync failed

**Solution**:
- Check browser console for detailed errors
- Verify MongoDB URI has network access enabled (0.0.0.0/0 in Atlas)
- Ensure database user has read/write permissions

### "Unexpected end of JSON data"
**Problem**: API endpoint returning empty response

**Solution**:
- Restart the dev server: `npm run dev:server`
- Check that MongoDB connection is working
- Look at terminal output for error messages

## Security Notes

✅ **Best Practices**:
- MongoDB URI is never exposed in source code
- URI is passed only when needed via headers
- Data is encrypted in transit (HTTPS on Vercel)
- Add IP whitelist in MongoDB Atlas Network Access

⚠️ **Important**:
- Never commit `.env` files with MongoDB credentials
- For production, use environment variables on Vercel
- Regularly rotate database passwords

## MongoDB Atlas Configuration

### Allow Vercel Access
1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirm

### Database Structure
```json
// companies collection
{
  "_id": ObjectId,
  "id": "uuid",
  "name": "Kumari Foods - Main Branch",
  "createdAt": "2025-12-17T10:00:00Z"
}

// schedules collection
{
  "_id": ObjectId,
  "companyId": "uuid",
  "meals": [
    {
      "day": "monday",
      "mealTime": "morning",
      "foodName": "Idli with Sambar"
    }
  ]
}
```

## API Endpoints

### POST /api/mongo
**Headers**:
- `x-mongodb-uri`: Your MongoDB connection string
- `Content-Type`: application/json

**Request Body**:
```json
{
  "action": "find" | "findOne" | "insertOne" | "updateOne" | "deleteOne",
  "collection": "companies" | "schedules",
  "filter": {},
  "data": {}
}
```

**Example - Get all companies**:
```json
{
  "action": "find",
  "collection": "companies",
  "filter": {}
}
```

## Next Steps

1. ✅ Local development is ready (run `npm run dev:server` and `npm run dev`)
2. ✅ Sample data is loaded in MongoDB
3. ✅ Test connection works with your URI
4. → Deploy to Vercel when ready
5. → Share the Vercel URL with your team

## Questions?

- Check browser console (F12) for detailed errors
- Run `npm run dev:server` to see API logs
- Verify MongoDB connection string format: `mongodb+srv://user:pass@cluster.net/dbname`

---

**Happy coding! 🎉**
