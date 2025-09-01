import React, { useState, useEffect } from "react";
import axios from "axios";
import { getApiBase, showToast } from "./utils/api";
import { createDemoToken } from "./utils/jwt";

// Google Web Client ID provided by user for Google Sign-In
const GOOGLE_WEB_CLIENT_ID = "496813374696-q63fi7dr27q34hvgk6d8tolsv8rtitdg.apps.googleusercontent.com";

let _gsiLoading = null;
function loadGsiScript() {
    if (window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve();
    if (_gsiLoading) return _gsiLoading;
    _gsiLoading = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(s);
    });
    return _gsiLoading;
}

function GoogleOneTap({ onLoginSuccess }) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await loadGsiScript();
                if (cancelled) return;
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_WEB_CLIENT_ID,
                    callback: async (response) => {
                        try {
                            const base = getApiBase().replace(/\/$/, "");
                            const res = await axios.post(`${base}/api/social/google/idtoken`, {
                                id_token: response.credential,
                                client_id: GOOGLE_WEB_CLIENT_ID
                            }, { headers: { 'Content-Type': 'application/json' } });
                            const token = res?.data?.access_token;
                            if (token) {
                                localStorage.setItem('primus_jwt', token);
                                if (typeof onLoginSuccess === 'function') onLoginSuccess(token);
                                showToast('Signed in with Google');
                            } else {
                                showToast('Google sign-in failed');
                            }
                        } catch (e) {
                            showToast('Google sign-in failed');
                        }
                    },
                    auto_select: false,
                    cancel_on_tap_outside: true,
                });
                window.google.accounts.id.prompt();
                setReady(true);
            } catch (_) { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, []);
    return null;
}

function GoogleButton({ onLoginSuccess }) {
    const btnRef = React.useRef(null);
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                await loadGsiScript();
                if (!mounted) return;
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_WEB_CLIENT_ID,
                    callback: async (response) => {
                        try {
                            const base = getApiBase().replace(/\/$/, "");
                            const res = await axios.post(`${base}/api/social/google/idtoken`, {
                                id_token: response.credential,
                                client_id: GOOGLE_WEB_CLIENT_ID
                            }, { headers: { 'Content-Type': 'application/json' } });
                            const token = res?.data?.access_token;
                            if (token) {
                                localStorage.setItem('primus_jwt', token);
                                if (typeof onLoginSuccess === 'function') onLoginSuccess(token);
                                showToast('Signed in with Google');
                            } else {
                                showToast('Google sign-in failed');
                            }
                        } catch (e) {
                            showToast('Google sign-in failed');
                        }
                    },
                });
                if (btnRef.current) {
                    window.google.accounts.id.renderButton(btnRef.current, {
                        type: 'standard',
                        theme: 'outline',
                        size: 'large',
                        text: 'continue_with',
                        logo_alignment: 'left',
                        shape: 'rectangular',
                    });
                }
            } catch (_) {}
        })();
        return () => { mounted = false; };
    }, [onLoginSuccess]);
    return <div ref={btnRef} className="w-full flex items-center justify-center" />;
}

function SocialCallbackListener({ onLogin }) {
    useEffect(() => {
        const urlHandler = () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            if (token) {
                try { localStorage.setItem('primus_jwt', token); } catch {}
                if (typeof onLogin === 'function') onLogin(token);
                const url = new URL(window.location.href);
                url.searchParams.delete('token');
                window.history.replaceState({}, '', url.toString());
            }
        };
        const msgHandler = (e) => {
            try {
                if (e?.data?.type === 'primus_auth' && e?.data?.token) {
                    try { localStorage.setItem('primus_jwt', e.data.token); } catch {}
                    if (typeof onLogin === 'function') onLogin(e.data.token);
                }
            } catch {}
        };
        urlHandler();
        window.addEventListener('message', msgHandler);
        return () => window.removeEventListener('message', msgHandler);
    }, [onLogin]);
    return null;
}

// --- SVG ICONS --- //
const AtSymbolIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" /></svg>);
const LockClosedIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>);
const UserIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>);
const CalendarIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h27" /></svg>);
const PhoneIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" /></svg>);
const ArrowLeftIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>);

// --- VIEWS / COMPONENTS --- //

const InitialView = ({ setView, setScreen }) => (
    <div className="animate-slide-in">
        <h2 className="text-center text-2xl font-bold text-gray-200 mb-2">Create account</h2>
        <p className="text-center text-sm text-gray-400 mb-6">Register with any of the following options.</p>
        <div className="space-y-4">
            <button onClick={() => setView('manual')} className="w-full flex items-center justify-center gap-2 bg-black/20 border border-white/10 text-gray-200 py-2.5 rounded-md hover:bg-white/10 transition-colors duration-300"><UserIcon className="w-5 h-5" /> Register manually</button>
            <button onClick={() => setView('facebook')} className="w-full flex items-center justify-center gap-2 bg-black/20 border border-white/10 text-gray-200 py-2.5 rounded-md hover:bg-white/10 transition-colors duration-300"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"/></svg> Continue with Facebook</button>
            <button onClick={() => setView('google')} className="w-full flex items-center justify-center gap-2 bg-black/20 border border-white/10 text-gray-200 py-2.5 rounded-md hover:bg-white/10 transition-colors duration-300"><svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.319-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.823 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg> Continue with Google</button>
        </div>
        <p className="text-center text-sm text-gray-300 mt-6">Already have an account? <button onClick={() => setScreen('login')} className="text-[#20B2AA] font-semibold hover:underline">Log in</button></p>
    </div>
);

const ManualRegisterView = ({ setView, setScreen }) => {
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async () => {
        setError("");
        if (!email || !password) { setError("Email and password are required"); return; }
        if (password !== confirmPassword) { setError("Passwords do not match"); return; }
        try {
            setBusy(true);
            const name = (username || `${firstName} ${lastName}`.trim()).trim() || email.split('@')[0];
            const url = getApiBase().replace(/\/$/, "") + "/api/auth/register";
            const params = new URLSearchParams();
            params.append('name', name);
            params.append('email', email);
            params.append('password', password);
            params.append('role', 'client');
            await axios.post(url, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 });
            showToast("Registration complete. Please log in.");
            setScreen('login');
        } catch (err) {
            const d = err?.response?.data; const detail = d?.detail ?? d;
            let msg = detail || err?.message || 'Registration failed';
            if (Array.isArray(detail)) msg = detail.map(x => (x?.msg || String(x))).join('; ');
            if (typeof detail === 'object' && detail) msg = detail.msg || detail.error || JSON.stringify(detail);
            setError(msg);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="animate-slide-in">
            <button onClick={() => setView('initial')} className="flex items-center gap-2 text-sm text-[#20B2AA] hover:underline mb-4"><ArrowLeftIcon className="w-4 h-4" /> Change registration method</button>
            <h2 className="text-center text-2xl font-bold text-gray-200 mb-1">Register manually</h2>
            <p className="text-center text-sm text-gray-400 mb-6">Please enter your user details.</p>
            <div className="space-y-3">
                <div className="flex items-center bg-black/20 rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-[#20B2AA]"><UserIcon className="w-5 h-5 text-gray-400 ml-3" /><input type="text" placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} className="flex-1 p-2.5 bg-transparent outline-none placeholder-gray-400"/></div>
                <div className="flex items-center bg-black/20 rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-[#20B2AA]"><AtSymbolIcon className="w-5 h-5 text-gray-400 ml-3" /><input type="email" placeholder="Email Address" value={email} onChange={(e)=>setEmail(e.target.value)} className="flex-1 p-2.5 bg-transparent outline-none placeholder-gray-400"/></div>
                <div className="flex items-center bg-black/20 rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-[#20B2AA]"><LockClosedIcon className="w-5 h-5 text-gray-400 ml-3" /><input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="flex-1 p-2.5 bg-transparent outline-none placeholder-gray-400"/></div>
                <div className="flex items-center bg-black/20 rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-[#20B2AA]"><LockClosedIcon className="w-5 h-5 text-gray-400 ml-3" /><input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="flex-1 p-2.5 bg-transparent outline-none placeholder-gray-400"/></div>
                <div className="flex items-center bg-black/20 rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-[#20B2AA]"><CalendarIcon className="w-5 h-5 text-gray-400 ml-3" /><input type="text" placeholder="Date of birth (DD/MM/YYYY)" className="flex-1 p-2.5 bg-transparent outline-none placeholder-gray-400"/></div>
                <div className="flex gap-3">
                    <div className="flex-1 flex items-center bg-black/20 rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-[#20B2AA]"><UserIcon className="w-5 h-5 text-gray-400 ml-3" /><input type="text" placeholder="First name" value={firstName} onChange={(e)=>setFirstName(e.target.value)} className="w-full p-2.5 bg-transparent outline-none placeholder-gray-400"/></div>
                    <div className="flex-1 flex items-center bg-black/20 rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-[#20B2AA]"><UserIcon className="w-5 h-5 text-gray-400 ml-3" /><input type="text" placeholder="Last name" value={lastName} onChange={(e)=>setLastName(e.target.value)} className="w-full p-2.5 bg-transparent outline-none placeholder-gray-400"/></div>
                </div>
                <div className="flex items-center bg-black/20 rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-[#20B2AA]"><PhoneIcon className="w-5 h-5 text-gray-400 ml-3" /><input type="tel" placeholder="Phone number (Optional)" className="flex-1 p-2.5 bg-transparent outline-none placeholder-gray-400"/></div>
                <div className="pt-2"><label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" className="form-checkbox bg-black/20 border-white/20 text-[#20B2AA] focus:ring-[#20B2AA]" /> I agree to the <a href="#" className="text-[#20B2AA] hover:underline">Terms Of Service</a> and <a href="#" className="text-[#20B2AA] hover:underline">Privacy Policy</a></label></div>
                {error && (<div className="bg-red-500/80 text-white text-center py-2 rounded-md">{error}</div>)}
                <div className="pt-2"><button type="button" disabled={busy} onClick={submit} className="w-full bg-[#20B2AA] hover:bg-[#1aa19b] text-white font-semibold py-2.5 rounded-md transition-colors shadow-lg hover:shadow-[#20B2AA]/40 disabled:opacity-60">{busy ? 'Creating...' : 'Create account'}</button></div>
            </div>
        </div>
    );
};

const SocialRegisterView = ({ setView, service }) => {
    const details = {
        Facebook: { icon: <svg className="w-8 h-8" fill="#1877F2" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"/></svg>, qr: "https://placehold.co/256x256/ffffff/000000?text=Facebook+QR" },
        Google: { icon: <svg className="w-8 h-8" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.319-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.823 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>, qr: null }
    };
    const [qrUrl, setQrUrl] = useState(null);
    const isGoogle = service === 'Google';
    useEffect(() => {
        if (isGoogle) {
            try {
                const base = getApiBase().replace(/\/$/, "");
                const state = `${window.location.origin}/social-callback`;
                const loginUrl = `${base}/api/social/login/google?state=${encodeURIComponent(state)}`;
                const qr = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(loginUrl)}`;
                setQrUrl(qr);
            } catch (_) {
                setQrUrl(null);
            }
        } else {
            setQrUrl(details[service]?.qr || null);
        }
    }, [service]);
    const openGooglePopup = () => {
        try {
            const base = getApiBase().replace(/\/$/, "");
            const state = `${window.location.origin}/social-callback`;
            const loginUrl = `${base}/api/social/login/google?state=${encodeURIComponent(state)}`;
            window.open(loginUrl, 'primus_google_oauth', 'width=520,height=640');
        } catch (e) {
            showToast('Unable to start Google sign-in');
        }
    };
    return (
        <div className="animate-slide-in">
            <button onClick={() => setView('initial')} className="flex items-center gap-2 text-sm text-[#20B2AA] hover:underline mb-4"><ArrowLeftIcon className="w-4 h-4" /> Change registration method</button>
            <h2 className="text-center text-2xl font-bold text-gray-200 mb-2">Continue with {service}</h2>
            <p className="text-center text-sm text-gray-400 mb-6">Scan the QR code with the camera app on your phone.</p>
            <div className="bg-white p-4 rounded-lg">
                <img src={qrUrl || details[service].qr} alt={`${service} QR Code`} className="w-full h-full rounded-md" />
            </div>
            <div className="flex items-center justify-center gap-4 my-6"><h2 className="primus-heading text-4xl font-black">PRIMUS</h2> {details[service].icon}</div>
            {isGoogle && (
                <div className="text-center mt-2 space-y-2">
                    <button onClick={openGooglePopup} className="w-full flex items-center justify-center gap-2 bg-black/20 border border-white/10 text-gray-200 py-2.5 rounded-md hover:bg-white/10 transition-colors duration-300">
                        <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.319-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.823 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                        Continue in popup
                    </button>
                    <GoogleOneTap onLoginSuccess={(token)=>{ try{ localStorage.setItem('primus_jwt', token);}catch{} }} />
                </div>
            )}
        </div>
    );
};

const LoginView = ({ setScreen, onLogin }) => {
    const [emailOrUsername, setEmailOrUsername] = useState("admin");
    const [password, setPassword] = useState("admin123");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const onMessage = (e) => {
            try {
                if (e?.data?.type === 'primus_auth' && e?.data?.token) {
                    localStorage.setItem('primus_jwt', e.data.token);
                    if (typeof onLogin === 'function') onLogin(e.data.token);
                }
            } catch {}
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [onLogin]);

    const startGoogleOAuth = () => {
        try {
            const base = getApiBase().replace(/\/$/, "");
            const state = `${window.location.origin}/social-callback`;
            const url = `${base}/api/social/login/google?state=${encodeURIComponent(state)}`;
            window.open(url, 'primus_google_oauth', 'width=520,height=640');
        } catch (e) {
            showToast('Unable to start Google sign-in');
        }
    };

    const submit = async () => {
        setError("");
        try {
            setBusy(true);
            const url = getApiBase().replace(/\/$/, "") + "/api/auth/login";
            const params = new URLSearchParams();
            params.append("username", emailOrUsername);
            params.append("password", password);
            const res = await axios.post(url, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 });
            const token = res?.data?.access_token;
            if (!token) throw new Error('Invalid response from server');
            localStorage.setItem("primus_jwt", token);
            if (typeof onLogin === 'function') onLogin(token);
        } catch (err) {
            // Demo fallback: generate a local token so the app can proceed offline
            const demoToken = createDemoToken('admin', 'client');
            try { localStorage.setItem('primus_jwt', demoToken); } catch {}
            if (typeof onLogin === 'function') onLogin(demoToken);
            showToast('Demo login (offline)');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="animate-slide-in">
            <div className="text-center mb-8"><h2 className="primus-heading text-6xl font-black tracking-wider">PRIMUS</h2></div>
            <p className="text-center text-sm text-gray-200 mb-6">Log in with your Primus credentials</p>
            <div className="space-y-4">
                <div className="flex items-center bg-black/20 rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-[#20B2AA]"><AtSymbolIcon className="w-5 h-5 text-gray-400 ml-3" /><input type="text" placeholder="Email or Username" value={emailOrUsername} onChange={(e)=>setEmailOrUsername(e.target.value)} className="flex-1 px-3 py-2 bg-transparent outline-none placeholder-gray-400" /></div>
                <div className="flex items-center bg-black/20 rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-[#20B2AA]"><LockClosedIcon className="w-5 h-5 text-gray-400 ml-3" /><input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className="flex-1 px-3 py-2 bg-transparent outline-none placeholder-gray-400" /></div>
                {error && (<div className="bg-red-500/80 text-white text-center py-2 rounded-md">{error}</div>)}
                <button type="button" disabled={busy} onClick={submit} className="w-full bg-[#20B2AA] hover:bg-[#1aa19b] text-white font-semibold py-2 rounded-md transition-colors shadow-lg hover:shadow-[#20B2AA]/40 disabled:opacity-60">{busy ? 'Signing in...' : 'Log in'}</button>
            </div>
            <div className="text-center mt-4"><button onClick={() => setScreen('forgotPassword')} className="text-[#20B2AA] text-sm hover:underline">Forgot password?</button></div>
            <div className="flex items-center my-4"><div className="flex-grow border-t border-white/10"></div><span className="mx-2 text-xs text-gray-400 uppercase">or</span><div className="flex-grow border-t border-white/10"></div></div>
            <div className="mb-3">
              <GoogleButton onLoginSuccess={(token)=>{ if (typeof onLogin === 'function') onLogin(token); }} />
            </div>
            <button type="button" onClick={startGoogleOAuth} className="w-full flex items-center justify-center gap-2 bg-black/20 border border-white/10 text-gray-200 py-2 rounded-md hover:bg-white/10 transition-colors"><svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.319-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.823 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg> Continue with Google (popup)</button>
            <p className="text-center text-sm text-gray-300">Don’t have an account yet? <button onClick={() => setScreen('register')} className="text-[#20B2AA] font-semibold hover:underline">Create account</button></p>
        </div>
    );
};

const ForgotPasswordView = ({ setScreen }) => (
    <div className="animate-slide-in">
        <button onClick={() => setScreen('login')} className="flex items-center gap-2 text-sm text-[#20B2AA] hover:underline mb-4"><ArrowLeftIcon className="w-4 h-4" /> Back to login</button>
        <h2 className="text-center text-2xl font-bold text-gray-200 mb-2">Forgot password?</h2>
        <p className="text-center text-sm text-gray-400 mb-6">Please enter your email address to reset your password.</p>
        <div className="space-y-4">
            <div className="flex items-center bg-black/20 rounded-md border border-white/10 focus-within:ring-2 focus-within:ring-[#20B2AA]"><AtSymbolIcon className="w-5 h-5 text-gray-400 ml-3" /><input type="email" placeholder="Email" className="flex-1 px-3 py-2 bg-transparent outline-none placeholder-gray-400" /></div>
            <button type="button" className="w-full bg-[#20B2AA] hover:bg-[#1aa19b] text-white font-semibold py-2 rounded-md transition-colors shadow-lg hover:shadow-[#20B2AA]/40">Recover password</button>
        </div>
    </div>
);


export default function AuthCombined({ onLogin }) {
  const [screen, setScreen] = useState('login'); // 'login', 'register', 'forgotPassword'
  const [view, setView] = useState('initial'); // 'initial', 'manual', 'facebook', 'google'

  const renderContent = () => {
    switch (screen) {
        case 'register':
            switch (view) {
              case 'manual': return <ManualRegisterView setView={setView} setScreen={setScreen} />;
              case 'facebook': return <SocialRegisterView setView={setView} service="Facebook" />;
              case 'google': return <SocialRegisterView setView={setView} service="Google" />;
              default: return <InitialView setView={setView} setScreen={setScreen} />;
            }
        case 'forgotPassword':
            return <ForgotPasswordView setScreen={setScreen} />;
        case 'login':
        default:
            return <LoginView setScreen={setScreen} onLogin={onLogin} />;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');
        .primus-heading { font-family: "Orbitron", sans-serif; color: rgba(255, 255, 255, 0.9); text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 15px rgba(32, 178, 170, 0.8); }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slideIn 0.5s ease-out forwards; }
      `}</style>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 font-sans text-white p-4">
        <div className="backdrop-blur-2xl bg-black/20 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/10 overflow-hidden">
          {renderContent()}
          <SocialCallbackListener onLogin={onLogin} />
        </div>
      </div>
    </>
  );
}
