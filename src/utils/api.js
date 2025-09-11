const ENV_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || null;

function computeDefaultBase() {
  try {
    const host = typeof window !== 'undefined' ? (window.location?.hostname || '') : '';
    if (!host || host === 'localhost' || host === '127.0.0.1') return 'http://localhost:8000';
    const parts = host.split('.');
    if (parts.length >= 2) {
      const apex = parts.slice(-2).join('.');
      return `https://api.${apex}`;
    }
  } catch {}
  return 'http://localhost:8000';
}

export function getApiBase() {
  const stored = localStorage.getItem("primus_api_base");
  if (stored) return stored;
  // Prefer domain-derived default so it works on any device without manual setup
  const derived = computeDefaultBase();
  if (derived) return derived;
  if (ENV_BASE) return ENV_BASE;
  return 'http://localhost:8000';
}

export function setApiBase(url) {
  if (url && typeof url === "string") {
    localStorage.setItem("primus_api_base", url.replace(/\/$/, ""));
  }
}

export function authHeaders() {
  const token = localStorage.getItem("primus_jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Centralized toast
export function showToast(message) {
  const rootId = 'primus-toast-root';
  let root = document.getElementById(rootId);
  if (!root) { root = document.createElement('div'); root.id = rootId; root.className = 'primus-toast'; document.body.appendChild(root); }
  const item = document.createElement('div'); item.className = 'primus-toast-item'; item.textContent = message; root.appendChild(item); setTimeout(()=>{ try { root.removeChild(item);} catch {} }, 4000);
}

// Offline queue for POSTs
const QUEUE_KEY = 'primus_offline_queue_v1';
function readQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}
function writeQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {}
}

export async function postWithQueue(url, data, config = {}) {
  const attempt = async () => {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(config.headers || {}) },
      body: JSON.stringify(data)
    });
  };
  try {
    const res = await attempt();
    if (res.ok) return await res.json().catch(()=>({}));
    if (res.status === 0 || res.status >= 500) {
      const q = readQueue();
      q.push({ url, data, headers: config.headers || {} });
      writeQueue(q);
      showToast('Server unreachable. Action queued and will retry.');
      return null;
    }
    const text = await res.text().catch(()=>null);
    throw new Error(text || ('HTTP ' + res.status));
  } catch (e) {
    if (e && (e.name === 'TypeError' || /Failed to fetch/i.test(String(e.message||'')))) {
      const q = readQueue();
      q.push({ url, data, headers: config.headers || {} });
      writeQueue(q);
      showToast('Network error. Action queued and will retry.');
      return null;
    }
    throw e;
  }
}

export async function flushQueue() {
  const q = readQueue();
  if (!q.length) return;
  const next = [];
  for (const item of q) {
    try {
      const res = await fetch(item.url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(item.headers||{}) }, body: JSON.stringify(item.data) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } catch {
      next.push(item);
    }
  }
  writeQueue(next);
  if (next.length === 0) showToast('All queued actions sent.');
}

export function presetApiBases() {
  const presets = [computeDefaultBase(), 'http://localhost:8000'];
  return Array.from(new Set(presets));
}


