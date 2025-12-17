# MongoDB Cloud Sync Setup Guide

## Overview
Your Kumari Foods app now supports automatic cloud synchronization with MongoDB Atlas. All data is saved locally first, and can be synced to the cloud optionally.

## Data Storage Architecture

### Local Storage (Always Active)
- **IndexedDB**: Browser database for permanent offline storage
- Data persists even after closing the browser
- Capacity: ~50MB+ per origin
- No internet required

### Cloud Storage (Optional)
- **MongoDB Atlas**: Cloud database for backup and multi-device sync
- Only activates when you configure the API key
- All changes auto-sync to MongoDB

## Setup Instructions

### Step 1: Create MongoDB Atlas Account (If not already done)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up and create a free cluster
3. Connect to your existing cluster: `mongodb+srv://kumari:EUttGtfVazqgq23T@cluster0.iyjdmai.mongodb.net/`

### Step 2: Enable Data API in MongoDB Atlas
1. In MongoDB Atlas, go to **App Services** (or Data API)
2. Click **Enable Data API** if not already enabled
3. Create an API key:
   - Click **Create API Key**
   - Name it "Kumari Foods"
   - Copy the key (You'll need this!)

### Step 3: Configure in App
1. Open the Kumari Foods app
2. Click the **Cloud** button in the top header
3. Paste your MongoDB Data API key
4. Click **Test Connection**
5. If successful, click **Sync Data** to pull existing data

### Step 4: Auto-Sync (Automatic)
From now on:
- Every meal entry is automatically saved locally
- When you edit a meal, it syncs to MongoDB in the background
- If offline, changes are saved locally and synced when online
- If you add the API key later, click **Sync Data** to pull all records from the cloud

## Data Structure

### Companies Collection
```json
{
  "_id": "mongodb-id",
  "id": "unique-uuid",
  "name": "Company Name",
  "createdAt": "2024-12-17T10:30:00.000Z"
}
```

### Schedules Collection
```json
{
  "_id": "mongodb-id",
  "companyId": "company-uuid",
  "meals": [
    {
      "day": "monday",
      "mealTime": "morning",
      "foodName": "Rice and Curry"
    }
  ]
}
```

## Features

### ✅ Automatic Syncing
- Changes auto-save to MongoDB
- No manual save button needed
- Works even if offline (syncs when online)

### ✅ Local-First Design
- All data always saved locally first
- Works without internet
- MongoDB is just a backup

### ✅ Multi-Device Sync
- Access same data across devices
- Pull latest data with Sync button
- Changes from other devices auto-appear

### ✅ Data Privacy
- API Key stored in browser localStorage
- Direct MongoDB connection (no middleman)
- Your data only

## Troubleshooting

### Q: I don't have a MongoDB account
A: You can still use the app! Local IndexedDB storage will keep your data. The cloud sync is optional.

### Q: Connection test failed
A: Check your API key is correct. Go back to MongoDB Atlas > App Services to verify.

### Q: Data not syncing
A: Try clicking **Sync Data** button. If still not working, check browser console for errors.

### Q: How do I reset sync?
A: Clear browser cookies/storage and reconfigure the API key in Cloud Settings.

## MongoDB Atlas Credentials

Your current MongoDB connection:
- URL: `mongodb+srv://kumari:EUttGtfVazqgq23T@cluster0.iyjdmai.mongodb.net/`
- Database: `kumari_foods`
- Collections: `companies`, `schedules`

⚠️ **Note**: These are shared test credentials. For production, create your own MongoDB account!

## Local Storage Locations

### Browser
- **IndexedDB**: `KumariFoodsDB` (DevTools → Storage → IndexedDB)
- **localStorage**: API key stored under `mongodb_api_key`

### Development
- Set `VITE_MONGODB_API_KEY` in `.env.local`

## Need Help?

1. Check browser console for error messages
2. Verify MongoDB Data API is enabled in Atlas
3. Test connection from Cloud Settings button
4. All data is always safe locally - cloud is optional!
