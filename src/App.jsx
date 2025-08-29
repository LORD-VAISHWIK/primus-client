import React, { useState, useEffect } from "react";
import AuthCombined from "./login and register";
import Dashboard, { AppHeader } from "./Dashboard";
import Games from "./games";
import { getUserFromToken, isTokenValid } from "./utils/jwt";
import { getApiBase, authHeaders, flushQueue, showToast } from "./utils/api";
import axios from "axios";

const API_BASE = getApiBase();

function ShopPage() {
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => { (async()=>{ try { setLoading(true); const r = await axios.get(`${getApiBase()}/api/payment/product`, { headers: authHeaders() }); setProducts(r.data||[]);} catch{} finally { setLoading(false); } })(); }, []);
  const buy = async (id) => {
    try {
      setBusy(true);
      await axios.post(`${getApiBase()}/api/payment/order`, { items: [{ product_id: id, quantity: 1 }] }, { headers: { ...authHeaders(), 'Content-Type': 'application/json' } });
      showToast('Purchased');
    } catch (e) {
      showToast(e?.response?.data?.detail || 'Purchase failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="p-8 flex-1 overflow-hidden flex flex-col">
        <h2 className="text-3xl font-bold text-white mb-6">Shop</h2>
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            [...Array(6)].map((_,i)=> (<div key={i} className="glass-card h-28 animate-pulse" />))
          ) : products.length ? (
            products.map(p => (
              <div key={p.id} className="glass-card p-4">
                <div className="text-white font-semibold">{p.name}</div>
                <div className="text-gray-400 mb-3">${p.price}</div>
                <button className="bg-primary/80 hover:bg-primary text-white px-3 py-1 rounded text-sm" disabled={busy} onClick={()=>buy(p.id)}>Buy</button>
              </div>
            ))
          ) : (
            <div className="glass-card p-4 col-span-full text-gray-400">No products available.</div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrizePage() {
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { (async()=>{ try { setLoading(true); const r = await axios.get(`${getApiBase()}/api/prize/`, { headers: authHeaders() }); setPrizes(r.data||[]);} catch{} finally { setLoading(false); } })(); }, []);
  const redeem = async (id) => {
    try {
      await axios.post(`${getApiBase()}/api/prize/redeem/${id}`, null, { headers: authHeaders() });
      showToast('Prize redeemed. Please contact staff.');
    } catch(e) {
      showToast(e?.response?.data?.detail || 'Redeem failed');
    }
  };
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="p-8 flex-1 overflow-hidden flex flex-col">
        <h2 className="text-3xl font-bold text-white mb-6">Prize Vault</h2>
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            [...Array(6)].map((_,i)=> (<div key={i} className="glass-card h-24 animate-pulse" />))
          ) : prizes.length ? (
            prizes.map(p => (
              <div key={p.id} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{p.name}</div>
                  <div className="text-gray-400 text-sm">{p.coin_cost} coins</div>
                </div>
                <button className="bg-primary/80 hover:bg-primary text-white px-3 py-1 rounded text-sm" onClick={()=>redeem(p.id)}>Redeem</button>
              </div>
            ))
          ) : (
            <div className="glass-card p-4 col-span-full text-gray-400">No prizes available.</div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppsPage() {
  const apps = [
    { id: 'browser', name: 'Web Browser', note: 'Open web links (Windows client only)' },
    { id: 'discord', name: 'Discord', note: 'Chat with friends (Windows client only)' },
    { id: 'steam', name: 'Steam', note: 'Manage library (Windows client only)' }
  ];
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="p-8 flex-1 overflow-hidden flex flex-col">
        <h2 className="text-3xl font-bold text-white mb-6">Apps</h2>
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {apps.map(a => (
            <div key={a.id} className="glass-card p-4 flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">{a.name}</div>
                <div className="text-gray-400 text-sm">{a.note}</div>
              </div>
              <button className="bg-primary/80 hover:bg-primary text-white px-3 py-1 rounded text-sm" onClick={()=>alert('App launching is available in the Windows client.')}>Open</button>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArcadePage() {
  const [lbs, setLbs] = useState([]);
  const [entries, setEntries] = useState([]);
  const [sel, setSel] = useState(null);
  const [events, setEvents] = useState([]);
  useEffect(() => { (async()=>{ try { const r = await axios.get(`${getApiBase()}/api/leaderboard/`, { headers: authHeaders() }); setLbs(r.data||[]);} catch{} })(); }, []);
  useEffect(() => { (async()=>{ try { const r = await axios.get(`${getApiBase()}/api/event/`, { headers: authHeaders() }); setEvents(r.data||[]);} catch{} })(); }, []);
  useEffect(() => { if (!sel) return; (async()=>{ try { const r = await axios.get(`${getApiBase()}/api/leaderboard/${sel}`, { headers: authHeaders() }); setEntries(r.data||[]);} catch{} })(); }, [sel]);
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="p-8 flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        <div className="glass-card p-4">
          <h3 className="text-white font-semibold mb-3">Leaderboards</h3>
          <select value={sel || ''} onChange={e=>setSel(e.target.value)} className="w-full glass-input mb-2">
            <option value="">Select...</option>
            {lbs.map(l => <option key={l.id} value={l.id}>{l.name} ({l.scope})</option>)}
          </select>
          {entries.length > 0 && (
            <ul className="text-sm text-gray-200 max-h-60 overflow-auto space-y-2">
              {entries.map(e => (
                <li key={e.id} className="glass-item">{e.user_id}: {e.value}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass-card p-4">
          <h3 className="text-white font-semibold mb-3">Events</h3>
          <ul className="space-y-2">
            {events.map(ev => (
              <li key={ev.id} className="glass-item flex items-center justify-between">
                <div>
                  <div className="text-white">{ev.name}</div>
                  <div className="text-gray-400 text-xs">{ev.type}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        </div>
      </div>
    </div>
  );
}
export default function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [jwt, setJwt] = useState(localStorage.getItem("primus_jwt"));
  const [currentUser, setCurrentUser] = useState(null);
  const [pcId, setPcId] = useState(null);
  const [locked, setLocked] = useState(false);
  const [nextBooking, setNextBooking] = useState(null);
  const [networkOnline, setNetworkOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Check token validity and get user info on mount and when jwt changes
  useEffect(() => {
    if (jwt && jwt !== "dummy_token_for_demo") {
      const fetchMe = async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/auth/me`, { headers: authHeaders() });
          setCurrentUser(res.data);
        } catch {
          // Fallback to local token parsing even if exp parsing fails
          const fallback = getUserFromToken();
          if (fallback) setCurrentUser(fallback); else setCurrentUser(null);
        }
      };
      fetchMe();
    } else {
      setCurrentUser(null);
    }
  }, [jwt]);

  // Network status indicator
  useEffect(() => {
    const onOnline = () => setNetworkOnline(true);
    const onOffline = () => setNetworkOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Low-time popup checker
  useEffect(() => {
    let timer;
    const check = async () => {
      try {
        if (!currentUser || !pcId) return;
        const res = await axios.get(`${getApiBase()}/api/billing/estimate-timeleft`, { params: { pc_id: pcId }, headers: authHeaders() });
        const minutes = res.data?.minutes ?? null;
        if (minutes != null && minutes <= 5) {
          // Toast
          const rootId = 'primus-toast-root';
          let root = document.getElementById(rootId);
          if (!root) {
            root = document.createElement('div');
            root.id = rootId;
            root.className = 'primus-toast';
            document.body.appendChild(root);
          }
          const item = document.createElement('div');
          item.className = 'primus-toast-item';
          item.textContent = `Only ${minutes} minutes left. Buy more time from the sidebar.`;
          root.appendChild(item);
          setTimeout(() => { try { root.removeChild(item); } catch {} }, 5000);
        }
      } catch {}
    };
    timer = setInterval(check, 60000);
    return () => { if (timer) clearInterval(timer); };
  }, [currentUser, pcId]);

  // Booking/lock overlay (fullscreen message with countdown)
  useEffect(() => {
    let timer;
    const overlayId = 'primus-lock-overlay';
    const ensureOverlay = () => {
      let el = document.getElementById(overlayId);
      if (!el) {
        el = document.createElement('div');
        el.id = overlayId;
        el.style.position = 'fixed';
        el.style.inset = '0';
        el.style.background = 'rgba(0,0,0,0.85)';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.zIndex = '100000';
        el.style.color = '#fff';
        el.style.fontSize = '24px';
        el.style.textAlign = 'center';
        el.style.padding = '24px';
        document.body.appendChild(el);
      }
      return el;
    };
    const removeOverlay = () => {
      const el = document.getElementById(overlayId);
      if (el && el.parentElement) el.parentElement.removeChild(el);
    };
    const tick = () => {
      if (!locked && !nextBooking) {
        removeOverlay();
        return;
      }
      const el = ensureOverlay();
      let msg = 'This PC is currently locked.';
      if (nextBooking?.start_time) {
        const start = new Date(nextBooking.start_time);
        const now = new Date();
        const diffMs = Math.max(0, start.getTime() - now.getTime());
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        msg = locked ? `Reserved. Starts in ${mins}m ${secs}s` : `Upcoming reservation in ${mins}m ${secs}s`;
      }
      el.textContent = msg;
    };
    if (locked || nextBooking) {
      tick();
      timer = setInterval(tick, 1000);
    } else {
      removeOverlay();
    }
    return () => { if (timer) clearInterval(timer); };
  }, [locked, nextBooking]);

  // Flush offline queue when back online
  useEffect(() => {
    if (networkOnline) {
      flushQueue();
    }
  }, [networkOnline]);

  // Auto-register this client PC on first login and start heartbeat
  useEffect(() => {
    let heartbeatTimer;
    let commandTimer;
    const registerAndHeartbeat = async () => {
      try {
        const pcName = localStorage.getItem("primus_pc_name") || `PC-${Math.floor(Math.random()*10000)}`;
        // Demo mode: skip license registration so UI loads immediately
        // Optionally register a transient client session later if needed
        const sendHeartbeat = async () => {
          if (pcId) {
            const res = await axios.post(`${getApiBase()}/api/clientpc/heartbeat/${pcId}`, null, { headers: authHeaders() });
            const isLocked = res?.data?.status === 'locked';
            setLocked(isLocked);
            document.body.style.filter = isLocked ? 'blur(2px)' : '';
          }
        };
        heartbeatTimer = setInterval(sendHeartbeat, 15000);
        const pollCommands = async () => {
          try {
            if (!pcId) return;
            const res = await axios.post(`${getApiBase()}/api/command/fetch`, new URLSearchParams({ pc_id: String(pcId) }), { headers: { ...authHeaders(), 'Content-Type': 'application/x-www-form-urlencoded' } });
            if (res.data && res.data.command) {
              const cmd = res.data.command;
              if (cmd === 'message' && res.data.params) {
                try { const p = JSON.parse(res.data.params); showToast(p.text || 'Message'); } catch { showToast(res.data.params); }
              }
              if (cmd === 'logout') {
                // Release any license if assigned
                try {
                  const id = localStorage.getItem('primus_last_assignment');
                  if (id) {
                    await axios.post(`${getApiBase()}/api/license/release/${id}`, null, { headers: authHeaders() });
                    localStorage.removeItem('primus_last_assignment');
                  }
                } catch {}
                localStorage.removeItem('primus_jwt');
                window.location.reload();
              }
              if (cmd === 'lock') {
                document.body.style.filter = 'blur(2px)';
              }
              if (cmd === 'unlock') {
                document.body.style.filter = '';
              }
              if (cmd === 'shutdown') { /* handled by Windows client */ }
              if (cmd === 'restart') { /* handled by Windows client */ }
              if (cmd === 'launch' && res.data.params) { /* handled by Windows client */ }
            }
          } catch {}
        };
        // Poll commands and booking lock status
        commandTimer = setInterval(async () => {
          await pollCommands();
          try {
            if (pcId) {
              const nb = await axios.get(`${getApiBase()}/api/booking/next/${pcId}`, { headers: authHeaders() });
              setNextBooking(nb?.data || null);
            }
          } catch {}
        }, 5000);
      } catch (e) {
        // ignore
      }
    };
    registerAndHeartbeat();
    // Clean up any stale server session if client crashed with stored id
    (async () => {
      try {
        const sid = localStorage.getItem('primus_active_session_id');
        if (sid) {
          await axios.post(`${getApiBase()}/api/session/stop/${sid}`, null, { headers: authHeaders() });
          localStorage.removeItem('primus_active_session_id');
          // toast notify
          showToast('Recovered from previous session. Cleaned up server session.');
        }
      } catch {}
    })();
    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (commandTimer) clearInterval(commandTimer);
    };
  }, [currentUser, pcId]);

  const handleLogin = (token) => {
    localStorage.setItem("primus_jwt", token);
    setJwt(token); // This will trigger the useEffect to get user info
  };

  const handleLogout = () => {
    localStorage.removeItem("primus_jwt");
    setJwt(null);
    setCurrentUser(null);
    setActivePage('home'); // Reset to home page
    setShowRegister(false); // Ensure we show login, not register
  };

  const handleNavigate = (page) => {
    const key = page.replace(/\s+/g, '-');
    if (['home','games','shop','prize','arcade','apps'].includes(page) || ['prize-vault'].includes(key)) {
      setActivePage(key);
    } else {
      alert(`Navigation to "${page}" is not implemented in this demo.`);
    }
  };

  const adminUnlockFlow = async () => {
    try {
      const email = prompt('Admin email/username:');
      if (!email) return;
      const password = prompt('Password:');
      if (!password) return;
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      const loginRes = await axios.post(`${API_BASE}/api/auth/login`, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      const adminToken = loginRes?.data?.access_token;
      if (!adminToken) throw new Error('No token');
      const me = await axios.get(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${adminToken}` } });
      const role = me?.data?.role;
      if (role === 'admin' || role === 'owner' || role === 'superadmin') {
        showToast('Admin verified. Use the Windows app (PrimusClient.Wpf) for kiosk unlock.');
      } else {
        showToast('Insufficient permissions.');
      }
    } catch (e) {
      showToast('Admin verification failed.');
    }
  };

  // Keyboard shortcut: Ctrl+P to toggle profile drawer
  useEffect(() => {
    const onKey = (e) => {
      // Super admin unlock shortcut: Ctrl+Shift+Alt+U
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        adminUnlockFlow();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        const el = document.getElementById('primus-profile');
        if (el) el.classList.toggle('hidden');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Super admin unlock shortcut (Ctrl+Shift+Alt+U) — web client shows guidance only
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        adminUnlockFlow();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // If the user is not logged in or user data hasn't loaded yet, show login
  if (!jwt || !currentUser) {
    return <AuthCombined onLogin={handleLogin} />;
  }

  // If the user IS logged in, show the correct page
  switch (activePage) {
    case 'home':
      return <div className="app-container">
        {!networkOnline && <div className="primus-offline-banner">You are offline. Actions will be queued and sent when back online.</div>}
        <Dashboard onLogout={handleLogout} onNavigate={handleNavigate} activePage={activePage} currentUser={currentUser} pcId={pcId} networkOnline={networkOnline} />
      </div>;
    case 'games':
      return <div className="app-container">
        {!networkOnline && <div className="primus-offline-banner">You are offline. Actions will be queued and sent when back online.</div>}
        <AppHeader onLogout={handleLogout} currentUser={currentUser} minutesLeft={null} active={false} networkOnline={networkOnline} onNavigate={handleNavigate} activePage={activePage} />
        <div className="app-content">
          <Games onLogout={handleLogout} onNavigate={handleNavigate} currentUser={currentUser} />
        </div>
      </div>;
    case 'arcade':
      return <div className="app-container">
        {!networkOnline && <div className="primus-offline-banner">You are offline. Actions will be queued and sent when back online.</div>}
        <AppHeader onLogout={handleLogout} currentUser={currentUser} minutesLeft={null} active={false} networkOnline={networkOnline} onNavigate={handleNavigate} activePage={activePage} />
        <div className="app-content">
          <ArcadePage />
        </div>
      </div>;
    case 'apps':
      return <div className="app-container">
        {!networkOnline && <div className="primus-offline-banner">You are offline. Actions will be queued and sent when back online.</div>}
        <AppHeader onLogout={handleLogout} currentUser={currentUser} minutesLeft={null} active={false} networkOnline={networkOnline} onNavigate={handleNavigate} activePage={activePage} />
        <div className="app-content">
          <AppsPage />
        </div>
      </div>;
    case 'shop':
      return <div className="app-container">
        {!networkOnline && <div className="primus-offline-banner">You are offline. Actions will be queued and sent when back online.</div>}
        <AppHeader onLogout={handleLogout} currentUser={currentUser} minutesLeft={null} active={false} networkOnline={networkOnline} onNavigate={handleNavigate} activePage={activePage} />
        <div className="app-content">
          <ShopPage />
        </div>
      </div>;
    case 'prize':
    case 'prize-vault':
      return <div className="app-container">
        {!networkOnline && <div className="primus-offline-banner">You are offline. Actions will be queued and sent when back online.</div>}
        <AppHeader onLogout={handleLogout} currentUser={currentUser} minutesLeft={null} active={false} networkOnline={networkOnline} onNavigate={handleNavigate} activePage={activePage} />
        <div className="app-content">
          <PrizePage />
        </div>
      </div>;
    default:
      return <div className="app-container">
        {!networkOnline && <div className="primus-offline-banner">You are offline. Actions will be queued and sent when back online.</div>}
        <Dashboard onLogout={handleLogout} onNavigate={handleNavigate} activePage={activePage} currentUser={currentUser} pcId={pcId} networkOnline={networkOnline} />
      </div>;
  }
}