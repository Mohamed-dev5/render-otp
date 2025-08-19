import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const expiresAt = admin.firestore.Timestamp.fromDate(
  new Date(Date.now() + 5 * 60 * 1000)
);
export const db = admin.firestore();
export const ad = admin.auth();
