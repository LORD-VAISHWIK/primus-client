import { invoke } from "../utils/invoke";
import { apiClient } from "./apiClient";
import { signRequest } from "../utils/signature";

export interface DeviceCredentials {
    pc_id: number;
    license_key: string;
    device_secret: string;
}

const CLIENT_CAPABILITIES = {
    version: "1.0.0",
    features: ["lock", "unlock", "message", "screenshot", "shutdown", "reboot", "restart", "login", "logout", "logoff"]
};

class CommandService {
    private pcId: number | null = null;
    private deviceSecret: string = '';
    private isRunning: boolean = false;
    private pollInterval: number = 2000;
    private heartbeatInterval: number = 15000; // Master System says 10-15s
    private onEventCallbacks: ((_event: any) => void)[] = [];
    private onConnectionChangeCallbacks: ((_connected: boolean) => void)[] = [];

    onEvent(callback: (_event: any) => void) {
        this.onEventCallbacks.push(callback);
    }

    onConnectionChange(callback: (_connected: boolean) => void) {
        this.onConnectionChangeCallbacks.push(callback);
    }

    private notifyEvent(event: any) {
        this.onEventCallbacks.forEach(cb => cb(event));
    }

    private notifyConnectionChange(connected: boolean) {
        this.onConnectionChangeCallbacks.forEach(cb => cb(connected));
    }

    async start() {
        if (this.isRunning) return;

        const creds = await invoke<DeviceCredentials | null>("get_device_credentials");
        if (!creds || !creds.device_secret) {
            console.log("No valid device credentials found. Handshake required.");
            return;
        }

        this.pcId = creds.pc_id;
        this.deviceSecret = creds.device_secret;
        this.isRunning = true;

        console.log(`Starting CommandService for PC #${this.pcId}`);

        // Handshake already registered the device, just notify connection is ready
        this.notifyConnectionChange(true);

        // Start loops in background (don't await - they run forever)
        this.startHeartbeatLoop();
        this.startCommandPullLoop();
    }

    private async startHeartbeatLoop() {
        while (this.isRunning) {
            try {
                if (this.pcId) {
                    await this.signedPost('/clientpc/heartbeat', {});
                    this.notifyConnectionChange(true);
                }
            } catch (e) {
                console.error("Heartbeat failed", e);
                this.notifyConnectionChange(false);
            }
            await new Promise(r => setTimeout(r, this.heartbeatInterval));
        }
    }

    private async startCommandPullLoop() {
        while (this.isRunning) {
            try {
                if (this.pcId) {
                    // MASTER SYSTEM: Long-poll for commands (switched to POST for signing)
                    const response = await this.signedPost('/command/pull', {
                        timeout: 25
                    });

                    this.notifyConnectionChange(true);
                    const commands = response.data;
                    if (commands && commands.length > 0) {
                        for (const cmd of commands) {
                            // Check if this is a "special" event command or a real system command
                            if (["chat.message", "pc.time.update", "shop.purchase", "notification", "message"].includes(cmd.command)) {
                                try {
                                    const payload = typeof cmd.params === 'string' ? JSON.parse(cmd.params) : cmd.params;
                                    this.notifyEvent({ event: cmd.command, payload });
                                    await this.ack(cmd.id, "SUCCEEDED", { ok: true });
                                } catch (e) {
                                    console.error("Failed to parse event params", e);
                                    await this.ack(cmd.id, "FAILED", { error: "Parse error" });
                                }
                            } else {
                                await this.executeCommand(cmd);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Command pull failed, retrying in 5s...", e);
                this.notifyConnectionChange(false);
                await new Promise(r => setTimeout(r, 5000));
            }
            await new Promise(r => setTimeout(r, 500));
        }
    }

    private async executeCommand(cmd: any) {
        console.log(`Executing command: ${cmd.command}`, cmd.params);
        await this.ack(cmd.id, "RUNNING");

        try {
            let result = null;
            switch (cmd.command) {
                case "lock":
                    this.notifyEvent({ event: 'lock', message: cmd.params });
                    // Actually lock the workstation
                    try {
                        await invoke("system_lock");
                    } catch (e) {
                        console.warn("System lock failed, using event only");
                    }
                    result = { status: "locked" };
                    break;
                case "unlock":
                    this.notifyEvent({ event: 'unlock' });
                    result = { status: "unlocked" };
                    break;
                case "message": {
                    const params = typeof cmd.params === 'string' ? JSON.parse(cmd.params) : cmd.params;
                    await invoke("show_notification", { title: "Admin Message", body: params.text || params });
                    this.notifyEvent({ event: 'message', message: params.text || params });
                    result = { status: "displayed" };
                    break;
                }
                case "shutdown":
                    this.notifyEvent({ event: 'shutdown' });
                    // Actually shutdown the computer
                    try {
                        await invoke("system_shutdown");
                        result = { status: "shutting_down" };
                    } catch (e: any) {
                        console.error("Shutdown failed:", e);
                        result = { status: "shutdown_failed", error: e.message };
                    }
                    break;
                case "restart":
                case "reboot":
                    this.notifyEvent({ event: 'restart' });
                    // Actually restart the computer
                    try {
                        await invoke("system_restart");
                        result = { status: "restarting" };
                    } catch (e: any) {
                        console.error("Restart failed:", e);
                        result = { status: "restart_failed", error: e.message };
                    }
                    break;
                case "logoff":
                    this.notifyEvent({ event: 'logoff' });
                    try {
                        await invoke("system_logoff");
                        result = { status: "logging_off" };
                    } catch (e: any) {
                        console.error("Logoff failed:", e);
                        result = { status: "logoff_failed", error: e.message };
                    }
                    break;
                case "cancel_shutdown":
                    try {
                        await invoke("system_cancel_shutdown");
                        result = { status: "shutdown_cancelled" };
                    } catch (e: any) {
                        result = { status: "cancel_failed", error: e.message };
                    }
                    break;
                case "logout":
                    // Same as logoff (backend uses 'logout', we use 'logoff')
                    this.notifyEvent({ event: 'logout' });
                    try {
                        await invoke("system_logoff");
                        result = { status: "logged_out" };
                    } catch (e: any) {
                        console.error("Logout failed:", e);
                        result = { status: "logout_failed", error: e.message };
                    }
                    break;
                case "login":
                    // Trigger user login UI or session start
                    this.notifyEvent({ event: 'login', params: cmd.params });
                    result = { status: "login_prompt_shown" };
                    break;
                case "screenshot":
                    // Take screenshot (placeholder - needs screenshot implementation)
                    this.notifyEvent({ event: 'screenshot' });
                    console.log("Screenshot requested - feature pending");
                    result = { status: "screenshot_requested", note: "Feature pending implementation" };
                    break;
                default:
                    throw new Error(`Unknown command: ${cmd.command}`);
            }
            await this.ack(cmd.id, "SUCCEEDED", result);
        } catch (error: any) {
            console.error(`Command ${cmd.command} failed`, error);
            await this.ack(cmd.id, "FAILED", { error: error.message });
        }
    }

    private async ack(commandId: number, state: string, result: any = null) {
        try {
            await this.signedPost('/command/ack', {
                command_id: commandId,
                state: state,
                result: result
            });
        } catch (e) {
            console.error("Failed to send ACK", e);
        }
    }

    private async signedPost(path: string, body: any) {
        if (!this.pcId || !this.deviceSecret) throw new Error("No device secret");

        const { signature, timestamp, nonce } = await signRequest("POST", `/api${path}`, body, this.deviceSecret);

        return apiClient.post(path, body, {
            headers: {
                'X-PC-ID': this.pcId.toString(),
                'X-Device-Signature': signature,
                'X-Device-Timestamp': timestamp,
                'X-Device-Nonce': nonce
            }
        });
    }

    stop() {
        this.isRunning = false;
    }
}

export const commandService = new CommandService();
export default commandService;

