import * as admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

let firebaseApp: admin.app.App | undefined;

export const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
  if (!serviceAccountPath) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY_PATH não definido no .env");
  }

  const serviceAccount = require(path.resolve(serviceAccountPath));

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  return firebaseApp;
};

export const getFirebaseStorage = () => {
  if (!firebaseApp) {
    throw new Error("Firebase não foi inicializado. Chame initializeFireBase() primeiro.");
  }
  return firebaseApp.storage();
};
