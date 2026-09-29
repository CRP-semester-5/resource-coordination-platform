import admin from 'firebase-admin'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

let serviceAccount;
try {
    serviceAccount = require('./serviceAccountKey.json')
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    console.warn("Firebase Admin SDK not initialized. Please add serviceAccountKey.json to config folder.")
}

export default admin;
