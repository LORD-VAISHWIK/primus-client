import { invoke } from "@tauri-apps/api/tauri";

/**
 * MASTER SYSTEM: Client-side HMAC signing utility.
 * Matches backend verify_device_signature logic.
 */
export async function signRequest(
    method: string, 
    path: string, 
    body: any, 
    deviceSecret: string
) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Math.random().toString(36).substring(2, 15);
    const bodyStr = body ? JSON.stringify(body) : "";
    
    // Payload = method + path + timestamp + nonce + body
    const payload = `${method.toUpperCase()}${path}${timestamp}${nonce}${bodyStr}`;
    
    // Use Rust to perform the HMAC-SHA256 for speed and security
    const signature = await invoke<string>("hmac_sha256", {
        key: deviceSecret,
        message: payload
    });

    return {
        signature,
        timestamp,
        nonce
    };
}

