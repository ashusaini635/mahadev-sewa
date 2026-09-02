import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
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

const newPassword = process.argv[2];

if (!newPassword || newPassword.length < 4) {
  console.log("❌ Usage: node scripts/reset-admin-password.mjs <new_password>");
  console.log("   Password must be at least 4 characters.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetPassword() {
  console.log("🕉️  Resetting Admin Password...\n");

  const q = query(collection(db, "members"), where("username", "==", "admin"));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log("❌ No admin user with username 'admin' found in Firestore.");
    process.exit(1);
  }

  const adminDoc = snapshot.docs[0];
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await updateDoc(doc(db, "members", adminDoc.id), {
    passwordHash,
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  });

  console.log("✅ Admin password updated successfully!");
  console.log(`   Username: admin`);
  console.log(`   New Password: ${newPassword}\n`);
  process.exit(0);
}

resetPassword().catch((err) => {
  console.error("❌ Error resetting admin password:", err.message);
  process.exit(1);
});
