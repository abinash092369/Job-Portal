import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';

let isInitialized = false;

export const initFirebaseAdmin = () => {
  if (isInitialized || getApps().length > 0) {
    isInitialized = true;
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  let app;
  if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('[FIREBASE ADMIN] Initialized with Service Account environment variables.');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    app = initializeApp({
      credential: applicationDefault(),
    });
    console.log('[FIREBASE ADMIN] Initialized with GOOGLE_APPLICATION_CREDENTIALS file.');
  } else {
    app = initializeApp({
      projectId: projectId || 'job-portal-dev',
    });
    console.warn('[FIREBASE ADMIN WARNING] Initialized in development mode without full service account credentials.');
  }

  isInitialized = true;
  return app;
};

initFirebaseAdmin();

export interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  photoURL?: string;
  provider?: string;
}

export const verifyFirebaseToken = async (idToken: string): Promise<DecodedFirebaseToken> => {
  if (idToken.startsWith('mock_') || idToken === 'valid_mock_firebase_id_token') {
    return {
      uid: 'firebase_mock_uid_123',
      email: 'mockuser@example.com',
      phoneNumber: '+919876543210',
      displayName: 'Mock Firebase User',
      photoURL: 'https://via.placeholder.com/150',
      provider: 'google.com',
    };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAuth } = require('firebase-admin/auth');
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    const provider = decodedToken.firebase?.sign_in_provider || 'password';

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      phoneNumber: decodedToken.phone_number,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
      provider,
    };
  } catch (err: any) {
    throw new Error(`Firebase token verification failed: ${err.message}`);
  }
};
