# LCRH Revenue Collection System — Setup Guide

## What this system does
- Multi-user revenue entry with real Firebase database
- Real-time sync — all users see the same data instantly
- Role-based access: Admin / Finance Officer / Viewer
- Dashboard, Analytics, Monthly Reports, Print to PDF
- Secure login with password reset via email

---

## STEP 1 — Create a Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Name it: `lcrh-revenue-system`
4. Disable Google Analytics (not needed) → **Create project**

---

## STEP 2 — Enable Authentication

1. In Firebase Console → left menu → **Authentication**
2. Click **"Get started"**
3. Under **Sign-in providers** → Enable **Email/Password**
4. Click **Save**

---

## STEP 3 — Create Firestore Database

1. Left menu → **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** → Next
4. Select region: **europe-west1** (closest to Kenya) → Done

### Set security rules:
In Firestore → **Rules** tab, paste this and click Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /revenue/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## STEP 4 — Get Your Firebase Config

1. Firebase Console → **Project Settings** (gear icon, top left)
2. Scroll down to **"Your apps"** → Click **"</>  Web"**
3. Register app name: `lcrh-revenue`
4. Copy the config object that looks like:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "lcrh-revenue-system.firebaseapp.com",
  projectId: "lcrh-revenue-system",
  storageBucket: "lcrh-revenue-system.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. Open the file: `src/firebase/config.js`
6. Replace the placeholder values with your real config

---

## STEP 5 — Install & Run

You need Node.js installed. Download from https://nodejs.org (LTS version).

Open a terminal/command prompt in the project folder, then:

```bash
npm install
npm start
```

The system opens at http://localhost:3000

---

## STEP 6 — Create the First Admin User

1. In Firebase Console → **Authentication** → **Users** tab
2. Click **"Add user"**
3. Enter your email (e.g. ogetii@lcrh.go.ke) and a password
4. Copy the **User UID** shown

5. In Firebase Console → **Firestore Database**
6. Click **"Start collection"** → Collection ID: `users` → Next
7. Document ID: paste the UID you copied
8. Add fields:
   - `name` (string): `Wycliffe Ogetii`
   - `email` (string): `ogetii@lcrh.go.ke`
   - `role` (string): `admin`
   - `active` (boolean): `true`
9. Click **Save**

Now you can log in. Once logged in as admin, use **User Management** to add all other users — no more manual Firestore needed.

---

## STEP 7 — Deploy Online (So Everyone Can Access It)

### Install Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Choose: Use existing project → lcrh-revenue-system
# Public directory: build
# Single page app: Yes
```

### Build and deploy:
```bash
npm run build
firebase deploy
```

Your system will be live at:
`https://lcrh-revenue-system.web.app`

Share that URL with your team. They log in with the accounts you create.

---

## User Roles

| Role | Can Do |
|------|--------|
| **Admin** | Everything — add users, delete records, change status, all reports |
| **Finance Officer** | Enter revenue, view records, analytics, reports |
| **Viewer** | View records, analytics, reports — cannot enter data |

---

## Adding More Users

1. Log in as Admin
2. Go to **User Management**
3. Fill in name, email, role, temporary password
4. Click **Create user**
5. Tell the new user their email and temporary password
6. They log in and change their password via Settings

---

## Support

System built for Lodwar County Referral Hospital Finance Department.
For technical issues, contact the system administrator.
