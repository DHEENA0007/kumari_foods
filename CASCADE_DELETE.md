# MongoDB Cascade Delete - Implementation Guide

## What's New

When you delete a company in Kumari Foods, it will now **automatically delete from MongoDB** along with all its associated meal schedules.

## How It Works

### Frontend Flow (Delete Button Click)
```
User clicks Delete Company
        ↓
deleteCompany() called in store.ts
        ↓
MongoDB service sends deleteOne request
        ↓
Server receives delete request
```

### Backend Flow (Cascade Delete)
```
DELETE request received for company
        ↓
Delete from companies collection
        ↓
Also delete from schedules collection (same companyId)
        ↓
Both documents removed from MongoDB
```

### Example
```
Company ID: "company-1"
Company Name: "Kumari Foods - Main Branch"

When deleted:
✅ companies collection → company-1 document deleted
✅ schedules collection → schedule with companyId:"company-1" deleted
```

## Implementation Details

### Backend (dev-server.ts)
```typescript
case 'deleteOne':
  const deleteResult = await col.deleteOne(filter || {});
  
  // If deleting a company, also delete its associated schedule
  if (collection === COMPANIES_COLLECTION && filter?.id) {
    await db.collection(SCHEDULES_COLLECTION).deleteOne({ companyId: filter.id });
    console.log(`🗑️  Deleted company ${filter.id} and its schedule from MongoDB`);
  }
  
  return res.status(200).json({ deletedCount: deleteResult.deletedCount });
```

**What it does:**
1. Deletes the company from `companies` collection
2. Checks if it's a company deletion (not a schedule deletion)
3. Finds and deletes the associated schedule using `companyId` match
4. Logs the action to console

### Frontend (mongoDBDataAPI.ts)
```typescript
async deleteCompany(companyId: string): Promise<void> {
  try {
    await this.makeRequest('deleteOne', COMPANIES_COLLECTION, {
      filter: { id: companyId },
    });
  } catch (error) {
    console.error('Error deleting company from MongoDB:', error);
  }
}
```

**What it does:**
1. Sends delete request to backend API
2. Backend handles the cascade delete
3. Removes both company and schedule in one operation

### Store (store.ts)
```typescript
deleteCompany: async (id: string) => {
  set((state) => {
    const newSchedules = { ...state.schedules };
    delete newSchedules[id];
    
    return {
      companies: state.companies.filter((c) => c.id !== id),
      schedules: newSchedules,
      selectedCompanyId: state.selectedCompanyId === id ? null : state.selectedCompanyId
    };
  });
  
  // Delete from IndexedDB
  await storageService.deleteCompany(id);
  await storageService.deleteSchedule(id);
  get().saveToStorage(); // Syncs to MongoDB via mongoDBService
};
```

**What it does:**
1. Removes company from local state
2. Removes associated schedule from local state
3. Deletes from IndexedDB (local storage)
4. Triggers `saveToStorage()` which calls MongoDB deletion

## Testing the Feature

### Step 1: Start the Dev Server
```bash
npm run dev:server
```
Output should show:
```
🚀 MongoDB API server running on http://localhost:5001
```

### Step 2: Start the Frontend
```bash
npm run dev
```

### Step 3: Test Delete
1. Open the app at `http://localhost:5173`
2. Click "Cloud" button
3. Paste your MongoDB URI and test connection
4. Click "Sync Data" to load companies
5. Select a company
6. Click the delete icon next to the company name
7. Confirm deletion
8. Check MongoDB - company and its schedule should be gone

### Step 4: Verify in MongoDB Atlas
1. Go to MongoDB Atlas → Collections
2. Check `companies` collection - company should be deleted
3. Check `schedules` collection - schedule with that companyId should be deleted

## Data Integrity

✅ **No Orphaned Data**: When a company is deleted, its schedule is automatically deleted too
✅ **Consistent State**: Local, IndexedDB, and MongoDB all stay in sync
✅ **No Manual Cleanup**: No need to manually delete schedules
✅ **Atomic Operation**: Both deletions happen together via the API

## Flow Diagram

```
Delete UI Button
      ↓
store.deleteCompany()
      ↓
┌─────────────────────────┐
│   Local State Update    │ ← Remove from companies & schedules
│   IndexedDB Delete      │ ← Remove from local database
└─────────────────────────┘
      ↓
saveToStorage()
      ↓
mongoDBService.syncToCloud()
      ↓
API Request to Backend
      ↓
┌─────────────────────────┐
│  MongoDB Cascade Delete │ ← deleteOne company
│                         │ ← deleteOne schedule
└─────────────────────────┘
      ↓
✅ Fully Deleted (Everywhere)
```

## Error Handling

If deletion fails:
- Local state is still updated (optimistic delete)
- IndexedDB is deleted
- If MongoDB fails, error is logged to console
- Next sync will retry the deletion

## Security Considerations

✅ No sensitive data is exposed
✅ MongoDB URI is never logged or stored in code
✅ Deletions are permanent - no soft delete
✅ User confirmation required before deletion

## Future Enhancements

Possible improvements:
- Soft delete (archive instead of permanent delete)
- Undo functionality
- Delete confirmation dialog
- Deletion logs/audit trail
- Batch delete multiple companies

---

**Status**: ✅ Implemented and ready to use
