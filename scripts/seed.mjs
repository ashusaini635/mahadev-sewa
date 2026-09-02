/**
 * Run this script ONCE to set up your database:
 * 1. Fill in your Firebase credentials in .env.local
 * 2. Run: node scripts/seed.mjs
 *
 * This creates:
 * - The first admin account (username: admin)
 * - The initial collection cycle (Aug 2026 → Feb 2027)
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("🕉️  Mahadev Seva — Database Seed Script\n");

  // ── 1. Create admin account ─────────────────────────────────────────────
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin123"; // CHANGE THIS after first login!

  const existingAdmin = await getDocs(
    query(collection(db, "members"), where("username", "==", ADMIN_USERNAME))
  );

  if (existingAdmin.empty) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await addDoc(collection(db, "members"), {
      name: "Admin",
      username: ADMIN_USERNAME,
      passwordHash,
      role: "admin",
      phone: "0000000000",
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ Admin account created`);
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   ⚠️  IMPORTANT: Change this password after first login!\n`);
  } else {
    console.log("ℹ️  Admin account already exists, skipping.\n");
  }

  // ── 2. Create initial cycle ─────────────────────────────────────────────
  const existingCycles = await getDocs(collection(db, "cycles"));
  if (existingCycles.empty) {
    await addDoc(collection(db, "cycles"), {
      label: "Mahashivratri 2027",
      startMonth: "2026-08",
      endDate: "2027-02-26",
      active: true,
    });
    console.log(`✅ Collection cycle created: Aug 2026 → Feb 26, 2027`);
    console.log(`   Monthly amount: ₹200 per member`);
    console.log(`   Total per member: ₹1,400 (7 months)\n`);
  } else {
    console.log("ℹ️  Cycles already exist, skipping.\n");
  }

  console.log("🎉 Seed complete! You can now:");
  console.log("   1. Start the app: npm run dev");
  console.log("   2. Login at http://localhost:3000/login");
  console.log("   3. Go to Admin → Members to add committee members");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});

