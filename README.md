# 🕉️ Mahadev Sawa — Committee Fund Tracker

A **100% free** Next.js web app to track monthly committee contributions (₹200/person) until Mahashivratri.

---

## Features

- 🔐 **Secure login** — Admin assigns each member a username + password
- 📊 **Admin Dashboard** — Full payment grid showing all members × all months at a glance
- 👤 **Member Dashboard** — Each member sees their own payment history
- ⚠️ **Pending Alert** — Automatic warning banner after the 15th if payment is not done
- 💰 **Total Collected** — Live counter of all money collected
- 🔄 **Cycle Management** — After Mahashivratri 2027, reset for 2028 collection with all data preserved
- 📱 **Mobile Friendly** — Works on phones and tablets

---

## Tech Stack (All Free)

| Service | What It Does | Cost |
|---------|-------------|------|
| **Next.js** | Web framework | Free |
| **Firebase Firestore** | Database (Spark plan) | Free |
| **NextAuth.js** | Authentication | Free |
| **Vercel** | Hosting | Free |

---

## Setup Guide

### Step 1: Firebase Setup (5 minutes)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Create a project"** → Name it `mahadev-sawa`
3. **Disable** Google Analytics → Create project
4. Go to **Firestore Database** → **Create database** → **Start in test mode** → Choose region
5. Go to **Project Settings** (gear icon) → **General** → scroll to "Your apps"
6. Click **</>** (Web app) → Register app → Copy the config values

### Step 2: Configure the App

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Firebase values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mahadev-sawa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mahadev-sawa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mahadev-sawa.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc...

NEXTAUTH_SECRET=any-random-long-string-at-least-32-chars
NEXTAUTH_URL=http://localhost:3000
```

> **Tip**: Generate a secret with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Step 3: Install & Run

```bash
npm install
node scripts/seed.mjs    # Creates admin account + first cycle
npm run dev              # Start the app
```

Open [http://localhost:3000](http://localhost:3000)

**Default admin login:**
- Username: `admin`
- Password: `admin123`
- ⚠️ Change this password from Admin → Members after first login!

### Step 4: Add Members

1. Login as admin
2. Go to **Members** page
3. Add each committee member with their name, username, and password
4. Share their username + password with each person

---

## Firebase Security Rules

After testing, go to **Firestore → Rules** and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow reads/writes from your app (server-side)
    match /{document=**} {
      allow read, write: if false; // All access through server
    }
  }
}
```

> **Note**: Since this app reads Firestore from the client side, use these rules for now:
> ```javascript
> match /{document=**} {
>   allow read: if true;
>   allow write: if false;
> }
> ```

---

## Deploy to Vercel (Free Hosting)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add all your `.env.local` variables in Vercel's environment settings
4. Update `NEXTAUTH_URL` to your Vercel URL (e.g., `https://mahadev-sawa.vercel.app`)
5. Deploy!

---

## Collection Details

| Period | Months | Per Person | 
|--------|--------|-----------|
| Sept 2026 → Feb 2027 | 6 months | ₹1,200 total |

---

## After Mahashivratri 2027

1. Login as admin → Go to **Cycle** page
2. Click **"Start New Cycle"**
3. Set new start month and Mahashivratri 2028 date
4. All 2026-2027 data is preserved and still viewable
5. New collection begins automatically 🙏

---

🚩 **Har Har Mahadev** 🚩

