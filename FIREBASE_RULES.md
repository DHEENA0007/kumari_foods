# Firebase Firestore Security Rules

To fix the "Missing or insufficient permissions" error for weekly schedules, you need to update your Firebase Firestore security rules.

## How to Update Rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on "Firestore Database" in the left sidebar
4. Click on the "Rules" tab
5. Replace the existing rules with the rules below
6. Click "Publish"

## Updated Security Rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow read/write access to companies collection
    match /companies/{companyId} {
      allow read, write: if true;
    }
    
    // Allow read/write access to meal schedules collection
    match /mealSchedules/{scheduleId} {
      allow read, write: if true;
    }
    
    // Allow read/write access to weekly schedules collection
    match /weeklySchedules/{scheduleId} {
      allow read, write: if true;
    }
  }
}
```

## Note:
These rules allow anyone to read and write data. For production use, you should implement proper authentication and authorization rules. Example with authentication:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Require authentication for all collections
    match /companies/{companyId} {
      allow read, write: if request.auth != null;
    }
    
    match /mealSchedules/{scheduleId} {
      allow read, write: if request.auth != null;
    }
    
    match /weeklySchedules/{scheduleId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

After updating the rules, refresh your application and the weekly schedules should save and load properly.
