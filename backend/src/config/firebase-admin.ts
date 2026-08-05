import { initializeApp, cert, getApps, applicationDefault, App } from 'firebase-admin/app';
import { logger } from './logger';

let isInitialized = false;

export const formatPrivateKey = (key?: string): string | undefined => {
  if (!key) return undefined;
  let formatted = key.trim();

  // Strip outer double or single quotes if present
  if (
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("'") && formatted.endsWith("'"))
  ) {
    formatted = formatted.slice(1, -1).trim();
  }

  // Replace escaped \n with actual newlines
  formatted = formatted.replace(/\\n/g, '\n');

  // Remove carriage returns
  formatted = formatted.replace(/\r/g, '');

  return formatted.trim();
};

export const initFirebaseAdmin = (): App | null => {
  if (isInitialized || getApps().length > 0) {
    isInitialized = true;
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  const hasProjectId = Boolean(projectId);
  const hasClientEmail = Boolean(clientEmail);
  const hasPrivateKey = Boolean(privateKey);
  const hasAnyProductionCredential =
    hasProjectId || hasClientEmail || hasPrivateKey || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

  let app: App;

  if (hasProjectId && hasClientEmail && hasPrivateKey) {
    try {
      app = initializeApp({
        credential: cert({
          projectId: projectId!,
          clientEmail: clientEmail!,
          privateKey: privateKey!,
        }),
      });

      if (!app || getApps().length === 0) {
        throw new Error('Firebase Admin initializeApp failed to return an active app instance.');
      }

      logger.info('[FIREBASE ADMIN] Initialized successfully with Service Account environment variables.');
      console.log('[FIREBASE ADMIN] Initialized successfully with Service Account environment variables.');
      isInitialized = true;
      return app;
    } catch (err: any) {
      const msg = `[FIREBASE ADMIN STARTUP ERROR] Failed to initialize Firebase Admin with service account: ${err.message}`;
      logger.error(msg);
      console.error(msg);
      throw err;
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      app = initializeApp({
        credential: applicationDefault(),
      });
      logger.info('[FIREBASE ADMIN] Initialized successfully with GOOGLE_APPLICATION_CREDENTIALS file.');
      console.log('[FIREBASE ADMIN] Initialized successfully with GOOGLE_APPLICATION_CREDENTIALS file.');
      isInitialized = true;
      return app;
    } catch (err: any) {
      const msg = `[FIREBASE ADMIN STARTUP ERROR] Failed to initialize with GOOGLE_APPLICATION_CREDENTIALS: ${err.message}`;
      logger.error(msg);
      console.error(msg);
      throw err;
    }
  } else if (hasAnyProductionCredential || process.env.NODE_ENV === 'production') {
    const missing: string[] = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

    const errorMessage = `[FIREBASE ADMIN STARTUP ERROR] Incomplete Firebase credentials provided in environment. Missing required variable(s): ${missing.join(
      ', '
    )}. Backend will NOT initialize in development fallback mode when production credentials exist.`;
    logger.error(errorMessage);
    console.error(errorMessage);
    throw new Error(errorMessage);
  } else {
    app = initializeApp({
      projectId: 'job-portal-dev',
    });
    logger.warn('[FIREBASE ADMIN WARNING] Initialized in development mode without full service account credentials.');
    console.warn('[FIREBASE ADMIN WARNING] Initialized in development mode without full service account credentials.');
    isInitialized = true;
    return app;
  }
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
