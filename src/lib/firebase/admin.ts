import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

let adminApp: App;

export function getFirebaseAdmin(): App {
  const currentApps = getApps();
  if (currentApps.length > 0) {
    return currentApps[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    adminApp = initializeApp({
      projectId: projectId || 'demo-project-id',
    });
  }

  return adminApp;
}

export async function verifyFirebaseIdToken(token: string): Promise<DecodedIdToken | null> {
  try {
    const app = getFirebaseAdmin();
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(token);
    return decoded;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}
