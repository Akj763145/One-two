import firebaseConfig from '../../firebase-applet-config.json';

let authInstance: any = null;
let providerInstance: any = null;
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let onAuthStateChangedFn: any = null;
let signInWithPopupFn: any = null;
let GoogleAuthProviderClass: any = null;

const initFirebase = async () => {
  if (authInstance) return;
  const { initializeApp } = await import('firebase/app');
  const { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup } = await import('firebase/auth');
  
  const app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  providerInstance = new GoogleAuthProvider();
  providerInstance.addScope('https://www.googleapis.com/auth/drive');
  
  onAuthStateChangedFn = onAuthStateChanged;
  signInWithPopupFn = signInWithPopup;
  GoogleAuthProviderClass = GoogleAuthProvider;
};

export const initAuth = async (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  await initFirebase();
  return onAuthStateChangedFn(authInstance, async (user: any) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        else if (onAuthFailure) onAuthFailure();
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    await initFirebase();
    const result = await signInWithPopupFn(authInstance, providerInstance);
    const credential = GoogleAuthProviderClass.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;  
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  if (authInstance) {
    await authInstance.signOut();
  }
  cachedAccessToken = null;
};
