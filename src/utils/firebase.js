import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';

let app; let auth;

export function initFirebase(cfg) {
  if (!app) {
    // Derive authDomain if not provided
    const derived = { ...cfg };
    if (!derived.authDomain && derived.projectId) {
      derived.authDomain = `${derived.projectId}.firebaseapp.com`;
    }
    app = initializeApp(derived);
    auth = getAuth(app);
  }
  return { app, auth };
}

export async function loginWithGoogle() {
  if (!auth) throw new Error('Firebase not initialized');
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  const idToken = await res.user.getIdToken();
  return { idToken, user: res.user };
}

// Try popup first, fall back to redirect to avoid COOP/popup issues
export async function loginWithGoogleFlex() {
  if (!auth) throw new Error('Firebase not initialized');
  const provider = new GoogleAuthProvider();
  try {
    const res = await signInWithPopup(auth, provider);
    const idToken = await res.user.getIdToken();
    return { idToken, user: res.user, method: 'popup' };
  } catch (e) {
    try {
      await signInWithRedirect(auth, provider);
      return { idToken: null, user: null, method: 'redirect' };
    } catch (e2) {
      throw e2;
    }
  }
}

export async function completeGoogleRedirect() {
  if (!auth) throw new Error('Firebase not initialized');
  const res = await getRedirectResult(auth).catch(() => null);
  if (res && res.user) {
    const idToken = await res.user.getIdToken();
    return { idToken, user: res.user };
  }
  return null;
}

export async function loadConfigFromEnvOrFile() {
  // Prefer env, fall back to public file; only apiKey and projectId are required
  const envCfg = {
    apiKey: import.meta.env.VITE_FB_API_KEY,
    authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FB_PROJECT_ID,
    appId: import.meta.env.VITE_FB_APP_ID,
  };
  // If env is sufficient, return it
  if (envCfg.apiKey && envCfg.projectId) {
    if (!envCfg.authDomain && envCfg.projectId) {
      envCfg.authDomain = `${envCfg.projectId}.firebaseapp.com`;
    }
    return envCfg;
  }
  // Try file
  try {
    const res = await fetch('/firebase-config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('missing firebase-config.json');
    const fileCfg = await res.json();
    if (fileCfg?.apiKey && fileCfg?.projectId) {
      if (!fileCfg.authDomain && fileCfg.projectId) {
        fileCfg.authDomain = `${fileCfg.projectId}.firebaseapp.com`;
      }
      return fileCfg;
    }
  } catch (_) {}
  throw new Error('Firebase config missing. Provide apiKey and projectId via VITE_FB_* or public/firebase-config.json');
}

