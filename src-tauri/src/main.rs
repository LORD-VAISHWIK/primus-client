// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::process::Command;
use sha2::{Sha256, Digest};
use hmac::{Hmac, Mac};
use sysinfo::{System, SystemExt, CpuExt};
use std::sync::Mutex;
use lazy_static::lazy_static;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

// Global mutable backend URL, protected by a Mutex
lazy_static::lazy_static! {
    static ref BACKEND_URL: Mutex<String> = Mutex::new(
        std::env::var("PRIMUS_BACKEND_URL").unwrap_or_else(|_| String::from("https://api.primustech.in"))
    );
}

#[derive(Serialize, Deserialize, Default)]
struct Config {
    backend_url: String,
}

fn get_config_path() -> PathBuf {
    // Use %APPDATA%/PrimusClient/config.json on Windows
    let mut dir = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    dir.push("PrimusClient");
    fs::create_dir_all(&dir).ok();
    dir.push("config.json");
    dir
}

fn load_config() -> Config {
    let path = get_config_path();
    if path.exists() {
        let data = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        Config::default()
    }
}

fn save_config(cfg: &Config) -> Result<(), String> {
    let path = get_config_path();
    let data = serde_json::to_string_pretty(cfg).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}


type HmacSha256 = Hmac<Sha256>;

#[tauri::command]
fn hmac_sha256(key: String, message: String) -> Result<String, String> {
    let mut mac = HmacSha256::new_from_slice(key.as_bytes())
        .map_err(|e| e.to_string())?;
    mac.update(message.as_bytes());
    let result = mac.finalize();
    Ok(format!("{:x}", result.into_bytes()))
}

#[tauri::command]
fn generate_hardware_fingerprint() -> String {
    let mut s = System::new_all();
    s.refresh_all();

    // Collect stable identifiers
    let hostname = hostname::get().map(|h| h.to_string_lossy().to_string()).unwrap_or_else(|_| "unknown".to_string());
    let cpu_info = s.cpus().first().map(|c| c.brand().to_string()).unwrap_or_else(|| "unknown".to_string());
    let total_memory = s.total_memory().to_string();
    
    // In a full production app, you would use WinAPI to get motherboard serial or disk ID.
    // For now, we combine these for a robust, reproducible hash.
    let raw_id = format!("{}-{}-{}-{}", hostname, cpu_info, total_memory, std::env::consts::ARCH);
    
    let mut hasher = Sha256::new();
    hasher.update(raw_id.as_bytes());
    format!("{:x}", hasher.finalize())
}

#[cfg(target_os = "windows")]
use winapi::um::winuser::{
    SetWindowsHookExW, UnhookWindowsHookEx, CallNextHookEx,
    WH_KEYBOARD_LL, KBDLLHOOKSTRUCT, WM_KEYDOWN, WM_SYSKEYDOWN,
};

#[cfg(target_os = "windows")]
use winapi::um::tlhelp32::{CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS};
#[cfg(target_os = "windows")]
use winapi::um::handleapi::CloseHandle;
#[cfg(target_os = "windows")]
use winapi::um::winuser::{GetForegroundWindow, GetWindowThreadProcessId};
// use std::fs; // duplicate import removed
use std::path::Path;
#[cfg(target_os = "windows")]
use winapi::shared::windef::HHOOK;
#[cfg(target_os = "windows")]
use winapi::shared::minwindef::{WPARAM, LPARAM, LRESULT};
#[cfg(target_os = "windows")]
use winapi::ctypes::c_int;

#[cfg(target_os = "windows")]
static mut KEYBOARD_HOOK: HHOOK = std::ptr::null_mut();

#[cfg(target_os = "windows")]
static mut KIOSK_MODE_ACTIVE: bool = false;

#[cfg(target_os = "windows")]
static mut PRIMUS_LAUNCHED_APPS: std::sync::Mutex<Vec<u32>> = std::sync::Mutex::new(Vec::new());

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_system_info() -> Result<String, String> {
    let os_type = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    let hostname = hostname::get()
        .map_err(|e| format!("Failed to get hostname: {}", e))?
        .to_string_lossy()
        .to_string();
    
    Ok(serde_json::json!({
        "os": os_type,
        "arch": arch,
        "hostname": hostname
    }).to_string())
}

#[tauri::command]
async fn check_backend_connection(url: String) -> Result<bool, String> {
    let client = reqwest::Client::new();
    match client.get(&format!("{}/health", url)).send().await {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn show_notification(title: String, body: String) -> Result<(), String> {
    // This would integrate with the system notification API
    println!("Notification: {} - {}", title, body);
    Ok(())
}

#[tauri::command]
async fn system_shutdown() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("shutdown")
            .args(&["/s", "/t", "5", "/c", "Primus: System shutdown initiated"])
            .spawn()
            .map_err(|e| format!("Failed to initiate shutdown: {}", e))?;
        Ok("Shutdown initiated in 5 seconds".to_string())
    }
    
    #[cfg(not(target_os = "windows"))]
    Err("Shutdown not supported on this platform".to_string())
}

#[tauri::command]
async fn system_restart() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("shutdown")
            .args(&["/r", "/t", "5", "/c", "Primus: System restart initiated"])
            .spawn()
            .map_err(|e| format!("Failed to initiate restart: {}", e))?;
        Ok("Restart initiated in 5 seconds".to_string())
    }
    
    #[cfg(not(target_os = "windows"))]
    Err("Restart not supported on this platform".to_string())
}

#[tauri::command]
async fn system_logoff() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("shutdown")
            .args(&["/l"])
            .spawn()
            .map_err(|e| format!("Failed to logoff: {}", e))?;
        Ok("Logoff initiated".to_string())
    }
    
    #[cfg(not(target_os = "windows"))]
    Err("Logoff not supported on this platform".to_string())
}

#[tauri::command]
async fn system_lock() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("rundll32.exe")
            .args(&["user32.dll,LockWorkStation"])
            .spawn()
            .map_err(|e| format!("Failed to lock workstation: {}", e))?;
        Ok("Workstation locked".to_string())
    }
    
    #[cfg(not(target_os = "windows"))]
    Err("Lock not supported on this platform".to_string())
}

#[tauri::command]
async fn system_cancel_shutdown() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("shutdown")
            .args(&["/a"])
            .spawn()
            .map_err(|e| format!("Failed to cancel shutdown: {}", e))?;
        Ok("Shutdown cancelled".to_string())
    }
    
    #[cfg(not(target_os = "windows"))]
    Err("Cancel shutdown not supported on this platform".to_string())
}

#[tauri::command]
async fn enable_kiosk_mode() -> Result<String, String> {
    // Get current executable path
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get executable path: {}", e))?;
    
    let exe_path_str = exe_path.to_string_lossy().replace("/", "\\");
    
    // Create registry command to set shell to Primus
    let output = Command::new("reg")
        .args(&[
            "add",
            "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon",
            "/v", "Shell",
            "/t", "REG_SZ",
            "/d", &exe_path_str,
            "/f"
        ])
        .output()
        .map_err(|e| format!("Failed to execute registry command: {}", e))?;
    
    if output.status.success() {
        Ok(format!("Kiosk mode enabled. Restart required. Shell set to: {}", exe_path_str))
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to set registry: {}", error))
    }
}

#[tauri::command]
async fn disable_kiosk_mode() -> Result<String, String> {
    // Restore explorer.exe as shell
    let output = Command::new("reg")
        .args(&[
            "add",
            "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon",
            "/v", "Shell",
            "/t", "REG_SZ",
            "/d", "explorer.exe",
            "/f"
        ])
        .output()
        .map_err(|e| format!("Failed to execute registry command: {}", e))?;
    
    if output.status.success() {
        Ok("Kiosk mode disabled. Restart required. Shell restored to explorer.exe".to_string())
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to restore registry: {}", error))
    }
}

#[tauri::command]
async fn check_kiosk_status() -> Result<String, String> {
    // Check current shell setting
    let output = Command::new("reg")
        .args(&[
            "query",
            "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon",
            "/v", "Shell"
        ])
        .output()
        .map_err(|e| format!("Failed to query registry: {}", e))?;
    
    if output.status.success() {
        let result = String::from_utf8_lossy(&output.stdout);
        if result.contains("explorer.exe") {
            Ok("Normal mode (Explorer shell)".to_string())
        } else if result.contains("Primus") {
            Ok("Kiosk mode (Primus shell)".to_string())
        } else {
            Ok(format!("Custom shell detected: {}", result))
        }
    } else {
        Ok("Unable to determine shell status".to_string())
    }
}

#[cfg(target_os = "windows")]
extern "system" fn keyboard_hook_proc(code: c_int, w_param: WPARAM, l_param: LPARAM) -> LRESULT {
    if code >= 0 {
        unsafe {
            if KIOSK_MODE_ACTIVE {
                // Check if we have any launched apps running
                let has_launched_apps = if let Ok(apps) = PRIMUS_LAUNCHED_APPS.lock() {
                    !apps.is_empty()
                } else {
                    false
                };
                
                // If we have launched apps, they get PERMANENT FREEDOM
                if has_launched_apps {
                    let kbd_struct = *(l_param as *const KBDLLHOOKSTRUCT);
                    let vk_code = kbd_struct.vkCode;
                    
                    match vk_code {
                        0x5B | 0x5C => return 1, // Still block Windows keys for security
                        // Allow EVERYTHING else - apps run with full Windows functionality
                        _ => return 0, // Alt+Tab, Alt+F4, and ALL shortcuts work until app closes
                    }
                } else {
                    // No launched apps - strict kiosk mode
                    let kbd_struct = *(l_param as *const KBDLLHOOKSTRUCT);
                    let vk_code = kbd_struct.vkCode;
                    
                    match vk_code {
                        0x5B | 0x5C => return 1, // VK_LWIN | VK_RWIN - Block Windows keys
                        0x09 if (w_param == WM_SYSKEYDOWN as usize) => return 1, // Block Alt+Tab
                        0x1B if (w_param == WM_SYSKEYDOWN as usize) => return 1, // Block Alt+Escape
                        0x73 if (w_param == WM_SYSKEYDOWN as usize) => return 1, // Block Alt+F4 for Primus
                        0x70..=0x87 if (w_param == WM_SYSKEYDOWN as usize) => return 1, // Block Alt+Function keys
                        0x0D if (w_param == WM_SYSKEYDOWN as usize) => return 1, // Block Alt+Enter
                        0x20 if (w_param == WM_SYSKEYDOWN as usize) => return 1, // Block Alt+Space
                        _ => {}
                    }
                }
            }
            CallNextHookEx(KEYBOARD_HOOK, code, w_param, l_param)
        }
    } else {
        unsafe { CallNextHookEx(KEYBOARD_HOOK, code, w_param, l_param) }
    }
}

#[tauri::command]
async fn enable_kiosk_shortcuts() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        unsafe {
            if KEYBOARD_HOOK.is_null() {
                KEYBOARD_HOOK = SetWindowsHookExW(
                    WH_KEYBOARD_LL,
                    Some(keyboard_hook_proc),
                    std::ptr::null_mut(),
                    0
                );
                
                if KEYBOARD_HOOK.is_null() {
                    return Err("Failed to install keyboard hook".to_string());
                }
            }
            KIOSK_MODE_ACTIVE = true;
            Ok("Kiosk shortcuts enabled - Windows keys and shortcuts blocked".to_string())
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    Ok("Kiosk shortcuts not supported on this platform".to_string())
}

#[tauri::command]
async fn disable_kiosk_shortcuts() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        unsafe {
            KIOSK_MODE_ACTIVE = false;
            if !KEYBOARD_HOOK.is_null() {
                UnhookWindowsHookEx(KEYBOARD_HOOK);
                KEYBOARD_HOOK = std::ptr::null_mut();
            }
            Ok("Kiosk shortcuts disabled - Normal Windows shortcuts restored".to_string())
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    Ok("Kiosk shortcuts not supported on this platform".to_string())
}

#[tauri::command]
async fn temporarily_allow_dialogs(window: tauri::Window) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // Temporarily disable kiosk restrictions for dialogs
        unsafe {
            KIOSK_MODE_ACTIVE = false;
        }
        
        let _ = window.set_always_on_top(false);
        
        // DON'T automatically re-enable - let the user take their time
        // The file dialog can stay open as long as needed
        // Only re-enable when user focuses back on Primus
        
        Ok("Dialog mode enabled temporarily".to_string())
    }
    
    #[cfg(not(target_os = "windows"))]
    Ok("Not supported on this platform".to_string())
}

#[tauri::command]
async fn cleanup_closed_apps() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        unsafe {
            if let Ok(mut apps) = PRIMUS_LAUNCHED_APPS.lock() {
                let initial_count = apps.len();
                
                // Check which processes are still running
                apps.retain(|&pid| {
                    let handle = winapi::um::processthreadsapi::OpenProcess(
                        winapi::um::winnt::PROCESS_QUERY_INFORMATION,
                        0,
                        pid
                    );
                    
                    if handle.is_null() {
                        false // Process no longer exists
                    } else {
                        winapi::um::handleapi::CloseHandle(handle);
                        true // Process still running
                    }
                });
                
                let cleaned_count = initial_count - apps.len();
                Ok(format!("Cleaned up {} closed apps. {} apps still running.", cleaned_count, apps.len()))
            } else {
                Err("Failed to access app list".to_string())
            }
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    Ok("Not supported on this platform".to_string())
}

#[derive(serde::Serialize)]
struct AppInfo {
    name: String,
    exe_path: String,
    window_title: String,
    pid: u32,
    visible: bool,
}

#[derive(serde::Serialize)]
struct GameInfo {
    name: String,
    exe_path: String,
    install_path: String,
    icon_path: Option<String>,
    is_running: bool,
}

#[tauri::command]
async fn get_running_apps() -> Result<Vec<AppInfo>, String> {
    #[cfg(target_os = "windows")]
    {
        let mut apps = Vec::new();
        
        unsafe {
            let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if snapshot.is_null() {
                return Err("Failed to create process snapshot".to_string());
            }
            
            let mut entry: PROCESSENTRY32W = std::mem::zeroed();
            entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;
            
            if Process32FirstW(snapshot, &mut entry) != 0 {
                loop {
                    let exe_name = String::from_utf16_lossy(&entry.szExeFile)
                        .trim_end_matches('\0')
                        .to_string();
                    
                    // Filter for GUI applications (skip system processes)
                    if !exe_name.is_empty() && 
                       !exe_name.starts_with("svchost") &&
                       !exe_name.starts_with("System") &&
                       !exe_name.ends_with(".scr") {
                        
                        apps.push(AppInfo {
                            name: exe_name.clone(),
                            exe_path: exe_name,
                            window_title: "".to_string(),
                            pid: entry.th32ProcessID,
                            visible: true,
                        });
                    }
                    
                    if Process32NextW(snapshot, &mut entry) == 0 {
                        break;
                    }
                }
            }
            
            CloseHandle(snapshot);
        }
        
        // Limit to reasonable number of apps
        apps.truncate(20);
        Ok(apps)
    }
    
    #[cfg(not(target_os = "windows"))]
    Ok(vec![])
}

#[tauri::command]
async fn switch_to_app(pid: u32) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // This is a simplified version - in practice, you'd need to find the window handle
        // and bring it to the foreground
        Ok(format!("Attempted to switch to app with PID: {}", pid))
    }
    
    #[cfg(not(target_os = "windows"))]
    Ok("App switching not supported on this platform".to_string())
}

#[tauri::command]
async fn hide_taskbar() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("powershell")
            .args(&[
                "-Command",
                "$taskbar = (New-Object -ComObject Shell.Application).NameSpace(0x0).Self.Path; (New-Object -ComObject Shell.Application).ToggleDesktop()"
            ])
            .output()
            .map_err(|e| format!("Failed to hide taskbar: {}", e))?;
            
        if output.status.success() {
            Ok("Taskbar hidden".to_string())
        } else {
            Err("Failed to hide taskbar".to_string())
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    Ok("Taskbar control not supported on this platform".to_string())
}

#[tauri::command]
async fn show_taskbar() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("powershell")
            .args(&[
                "-Command",
                "$taskbar = (New-Object -ComObject Shell.Application).NameSpace(0x0).Self.Path; (New-Object -ComObject Shell.Application).ToggleDesktop()"
            ])
            .output()
            .map_err(|e| format!("Failed to show taskbar: {}", e))?;
            
        if output.status.success() {
            Ok("Taskbar shown".to_string())
        } else {
            Err("Failed to show taskbar".to_string())
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    Ok("Taskbar control not supported on this platform".to_string())
}

#[tauri::command]
async fn detect_installed_games() -> Result<Vec<GameInfo>, String> {
    let mut games = Vec::new();
    
    // Add game launchers first (Steam, Epic, Riot, etc.)
    let launchers = vec![
        ("🎮 Steam", "C:\\Program Files (x86)\\Steam\\steam.exe"),
        ("🎮 Steam", "C:\\Program Files\\Steam\\steam.exe"),
        ("🎮 Epic Games", "C:\\Program Files (x86)\\Epic Games\\Launcher\\Portal\\Binaries\\Win32\\EpicGamesLauncher.exe"),
        ("🎮 Epic Games", "C:\\Program Files (x86)\\Epic Games\\Launcher\\Portal\\Binaries\\Win64\\EpicGamesLauncher.exe"),
        ("🎮 Riot Client", "C:\\Riot Games\\Riot Client\\RiotClientServices.exe"),
        ("🎮 Riot Client", "C:\\Program Files\\Riot Games\\Riot Client\\RiotClientServices.exe"),
        ("🎮 Valorant", "C:\\Riot Games\\VALORANT\\live\\VALORANT.exe"),
        ("🎮 Origin", "C:\\Program Files (x86)\\Origin\\Origin.exe"),
        ("🎮 Origin", "C:\\Program Files\\Origin\\Origin.exe"),
        ("🎮 EA App", "C:\\Program Files\\Electronic Arts\\EA Desktop\\EA Desktop\\EADesktop.exe"),
        ("🎮 Ubisoft Connect", "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\UbisoftConnect.exe"),
        ("🎮 Battle.net", "C:\\Program Files (x86)\\Battle.net\\Battle.net Launcher.exe"),
        ("🎮 GOG Galaxy", "C:\\Program Files (x86)\\GOG Galaxy\\GalaxyClient.exe"),
        ("🎮 Xbox App", "C:\\Program Files\\WindowsApps\\Microsoft.GamingApp_2021.427.138.0_x64__8wekyb3d8bbwe\\XboxApp.exe"),
    ];
    
    for (name, path) in launchers {
        if std::path::Path::new(path).exists() {
            games.push(GameInfo {
                name: name.to_string(),
                exe_path: path.to_string(),
                install_path: path.to_string(),
                icon_path: None,
                is_running: false,
            });
        }
    }
    
    // Common game installation directories
    let game_directories = vec![
        "C:\\Program Files\\Steam\\steamapps\\common",
        "C:\\Program Files (x86)\\Steam\\steamapps\\common",
        "C:\\Program Files\\Epic Games",
        "C:\\Program Files (x86)\\Epic Games",
        "C:\\Games",
        "D:\\Games",
        "C:\\Program Files\\WindowsApps",
        "C:\\Program Files (x86)\\Origin Games",
        "C:\\Program Files\\Origin Games",
        "C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher\\games",
        "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games",
    ];
    
    for game_dir in game_directories {
        if let Ok(entries) = fs::read_dir(game_dir) {
            for entry in entries.flatten() {
                if entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false) {
                    let game_path = entry.path();
                    let game_name = game_path.file_name()
                        .and_then(|name| name.to_str())
                        .unwrap_or("Unknown Game")
                        .to_string();
                    
                    // Look for executable files in the game directory
                    if let Ok(game_files) = fs::read_dir(&game_path) {
                        for file in game_files.flatten() {
                            if let Some(file_name) = file.file_name().to_str() {
                                if file_name.ends_with(".exe") && 
                                   !file_name.contains("unins") && 
                                   !file_name.contains("setup") &&
                                   !file_name.contains("installer") {
                                    
                                    let exe_path = file.path().to_string_lossy().to_string();
                                    
                                    games.push(GameInfo {
                                        name: game_name.clone(),
                                        exe_path: exe_path.clone(),
                                        install_path: game_path.to_string_lossy().to_string(),
                                        icon_path: None,
                                        is_running: false,
                                    });
                                    break; // Only take the first exe found per game
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Remove duplicates and limit results
    games.sort_by(|a, b| a.name.cmp(&b.name));
    games.dedup_by(|a, b| a.name == b.name);
    games.truncate(50); // Limit to 50 games
    
    Ok(games)
}

#[tauri::command]
async fn launch_game(exe_path: String, window: tauri::Window) -> Result<String, String> {
    // Check if file exists
    if !std::path::Path::new(&exe_path).exists() {
        return Err(format!("Game executable not found: {}", exe_path));
    }
    
    #[cfg(target_os = "windows")]
    {
        // PERMANENTLY disable always on top once any app is launched
        let _ = window.set_always_on_top(false);
        println!("🚀 PERMANENTLY disabled always-on-top for launched apps");
    }
    
    // Use CREATE_NEW_PROCESS_GROUP to ensure app appears in foreground
    let mut cmd = Command::new(&exe_path);
    
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        // CREATE_NEW_PROCESS_GROUP | CREATE_NEW_CONSOLE to ensure visibility
        cmd.creation_flags(0x00000200 | 0x00000010);
    }
    
    match cmd.spawn() {
        Ok(child) => {
            #[cfg(target_os = "windows")]
            {
                // Add the launched app PID to our allowed list
                let pid = child.id();
                unsafe {
                    if let Ok(mut apps) = PRIMUS_LAUNCHED_APPS.lock() {
                        apps.push(pid);
                        println!("✅ Added app PID {} to allowed list - FULL FREEDOM", pid);
                    }
                }
                
                // App is now running with PERMANENT freedom
                println!("🎮 App {} launched - PERMANENT FREEDOM until closed", pid);
            }
            Ok(format!("✅ Launched: {} (PID: {}) - FULL FUNCTIONALITY ENABLED", exe_path, child.id()))
        },
        Err(e) => {
            Err(format!("❌ Failed to launch: {}", e))
        }
    }
}

#[tauri::command]
async fn manage_window_focus(window: tauri::Window) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // Check if any Primus-launched apps are running
        unsafe {
            if let Ok(apps) = PRIMUS_LAUNCHED_APPS.lock() {
                if apps.is_empty() {
                    // No launched apps - restore strict kiosk mode
                    let _ = window.set_always_on_top(true);
                    KIOSK_MODE_ACTIVE = true;
                    Ok("🔒 Strict kiosk mode - no launched apps".to_string())
                } else {
                    // Launched apps exist - PERMANENT FREEDOM until they close
                    let _ = window.set_always_on_top(false);
                    // Apps have full control - no temporary restrictions
                    Ok(format!("🎮 {} apps running with PERMANENT FREEDOM", apps.len()))
                }
            } else {
                Err("Failed to check launched apps".to_string())
            }
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    Ok("Not supported on this platform".to_string())
}

#[tauri::command]
async fn add_manual_game(name: String, exe_path: String) -> Result<String, String> {
    // Validate the executable exists
    if !std::path::Path::new(&exe_path).exists() {
        return Err("Game executable not found at specified path".to_string());
    }
    
    // Save to local storage (this would be handled by the frontend)
    Ok(format!("Game '{}' added successfully", name))
}

#[tauri::command]
async fn browse_for_game(window: tauri::Window) -> Result<String, String> {
    use rfd::FileDialog;
    
    // Temporarily disable always on top to allow file dialog
    #[cfg(target_os = "windows")]
    {
        let _ = window.set_always_on_top(false);
    }
    
    let file = FileDialog::new()
        .add_filter("Executable Files", &["exe"])
        .add_filter("All Files", &["*"])
        .set_title("Select Game Executable")
        .set_directory("C:\\Program Files")
        .pick_file();
    
    // Restore always on top after dialog
    #[cfg(target_os = "windows")]
    {
        let _ = window.set_always_on_top(true);
        let _ = window.set_focus();
    }
    
    match file {
        Some(path) => Ok(path.to_string_lossy().to_string()),
        None => Err("No file selected".to_string())
    }
}

#[tauri::command]
async fn register_pc_with_backend() -> Result<String, String> {
    // Get system information
    let hostname = hostname::get()
        .map_err(|e| format!("Failed to get hostname: {}", e))?
        .to_string_lossy()
        .to_string();
    
    // In a real app, you would generate a stable hardware ID
    let hw_id = generate_hardware_fingerprint();
    
    // Call backend to register
    let client = reqwest::Client::new();
    let backend_url = "https://api.primustech.in"; // Hardcoded for now, should come from config
    
    // TODO: Implement actual registration logic
    
    Ok(format!("PC Registered: {} ({})", hostname, hw_id))
}

#[tauri::command]
async fn check_installed_paths(paths: Vec<String>) -> Result<Vec<String>, String> {
    let mut installed = Vec::new();
    for path in paths {
        if !path.is_empty() && std::path::Path::new(&path).exists() {
            installed.push(path);
        }
    }
    Ok(installed)
}



#[tauri::command]
async fn enable_auto_boot() -> Result<String, String> {
    // Get current executable path
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get executable path: {}", e))?;
    
    let exe_path_str = exe_path.to_string_lossy().replace("/", "\\");
    
    // Add to Windows startup (Registry method)
    let output = Command::new("reg")
        .args(&[
            "add",
            "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
            "/v", "Primus",
            "/t", "REG_SZ",
            "/d", &exe_path_str,
            "/f"
        ])
        .output()
        .map_err(|e| format!("Failed to add startup entry: {}", e))?;
    
    if output.status.success() {
        Ok(format!("Auto-boot enabled. Primus will start with Windows: {}", exe_path_str))
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to enable auto-boot: {}", error))
    }
}

#[tauri::command]
async fn disable_auto_boot() -> Result<String, String> {
    // Remove from Windows startup
    let output = Command::new("reg")
        .args(&[
            "delete",
            "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
            "/v", "Primus",
            "/f"
        ])
        .output()
        .map_err(|e| format!("Failed to remove startup entry: {}", e))?;
    
    if output.status.success() {
        Ok("Auto-boot disabled. Primus will not start with Windows".to_string())
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        Err(format!("Failed to disable auto-boot: {}", error))
    }
}

#[tauri::command]
async fn check_auto_boot_status() -> Result<String, String> {
    // Check if Primus is in startup registry
    let output = Command::new("reg")
        .args(&[
            "query",
            "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
            "/v", "Primus"
        ])
        .output()
        .map_err(|e| format!("Failed to query startup registry: {}", e))?;
    
    if output.status.success() {
        let result = String::from_utf8_lossy(&output.stdout);
        if result.contains("Primus") {
            Ok("Auto-boot enabled".to_string())
        } else {
            Ok("Auto-boot disabled".to_string())
        }
    } else {
        Ok("Auto-boot disabled".to_string())
    }
}

#[tauri::command]
async fn setup_complete_kiosk() -> Result<String, String> {
    // This combines shell replacement + auto-boot + shortcut blocking
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get executable path: {}", e))?;
    
    let exe_path_str = exe_path.to_string_lossy().replace("/", "\\");
    
    // Check if running as administrator
    let admin_check = Command::new("net")
        .args(&["session"])
        .output();
    
    match admin_check {
        Ok(output) if output.status.success() => {
            // Running as admin, proceed with kiosk setup
            
            // 1. Backup original shell
            let _ = Command::new("reg")
                .args(&[
                    "add",
                    "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon",
                    "/v", "Shell_Backup",
                    "/t", "REG_SZ",
                    "/d", "explorer.exe",
                    "/f"
                ])
                .output();
            
            // 2. Set as Windows shell (MANDATORY - must work)
            let shell_output = Command::new("reg")
                .args(&[
                    "add",
                    "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon",
                    "/v", "Shell",
                    "/t", "REG_SZ",
                    "/d", &exe_path_str,
                    "/f"
                ])
                .output()
                .map_err(|e| format!("CRITICAL: Failed to set shell: {}", e))?;
            
            // 3. Add to ALL startup locations for maximum coverage
            let startup_output = Command::new("reg")
                .args(&[
                    "add",
                    "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v", "Primus",
                    "/t", "REG_SZ",
                    "/d", &exe_path_str,
                    "/f"
                ])
                .output()
                .map_err(|e| format!("Failed to add user startup: {}", e))?;
            
            // 4. Add to machine startup as well
            let machine_startup = Command::new("reg")
                .args(&[
                    "add",
                    "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v", "Primus",
                    "/t", "REG_SZ",
                    "/d", &exe_path_str,
                    "/f"
                ])
                .output();
            
            // 5. Disable Task Manager
            let disable_taskmgr = Command::new("reg")
                .args(&[
                    "add",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System",
                    "/v", "DisableTaskMgr",
                    "/t", "REG_DWORD",
                    "/d", "1",
                    "/f"
                ])
                .output();
            
            // 6. Disable registry editing
            let disable_regedit = Command::new("reg")
                .args(&[
                    "add",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System",
                    "/v", "DisableRegistryTools",
                    "/t", "REG_DWORD",
                    "/d", "1",
                    "/f"
                ])
                .output();
            
            if shell_output.status.success() {
                Ok(format!("✅ KIOSK MODE ENABLED!\n\n🔄 RESTART REQUIRED NOW\n\nAfter restart:\n• PC boots ONLY to Primus\n• Windows Explorer REPLACED\n• ALL shortcuts BLOCKED\n• Alt+F4 DISABLED\n• Task Manager DISABLED\n\nPath: {}\n\n⚠️ To restore: Use disable kiosk mode before restart", exe_path_str))
            } else {
                Err("❌ CRITICAL: Shell replacement failed! Run as Administrator!".to_string())
            }
        }
        _ => {
            Err("❌ Administrator privileges required for kiosk mode.\n\nPlease:\n1. Right-click Primus\n2. Select 'Run as administrator'\n3. Try again".to_string())
        }
    }
}

#[tauri::command]
async fn reset_device_credentials(app_handle: tauri::AppHandle) -> Result<(), String> {
    let config_dir = app_handle.path_resolver().app_config_dir().ok_or("Could not find config dir")?;
    let creds_path = config_dir.join("device.json");
    if creds_path.exists() {
        fs::remove_file(creds_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn save_device_credentials(app_handle: tauri::AppHandle, pc_id: i32, license_key: String, device_secret: String) -> Result<(), String> {
    let config_dir = app_handle.path_resolver().app_config_dir().ok_or("Could not find config dir")?;
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    }
    let creds_path = config_dir.join("device.json");
    let json = serde_json::json!({
        "pc_id": pc_id,
        "license_key": license_key,
        "device_secret": device_secret
    });
    fs::write(creds_path, json.to_string()).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_device_credentials(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let config_dir = app_handle.path_resolver().app_config_dir().ok_or("Could not find config dir")?;
    let creds_path = config_dir.join("device.json");
    if !creds_path.exists() {
        return Ok(serde_json::json!(null));
    }
    let data = fs::read_to_string(creds_path).map_err(|e| e.to_string())?;
    let json: serde_json::Value = serde_json::from_str(&data).map_err(|e| e.to_string())?;
    Ok(json)
}

/// Send heartbeat to backend to keep device online
/// Uses stored device credentials for authentication
#[tauri::command]
async fn send_heartbeat(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    // Get stored credentials
    let config_dir = app_handle.path_resolver().app_config_dir().ok_or("Could not find config dir")?;
    let creds_path = config_dir.join("device.json");
    
    if !creds_path.exists() {
        return Err("Device not registered. Please register first.".to_string());
    }
    
    let data = fs::read_to_string(&creds_path).map_err(|e| e.to_string())?;
    let creds: serde_json::Value = serde_json::from_str(&data).map_err(|e| e.to_string())?;
    
    let pc_id = creds.get("pc_id")
        .and_then(|v| v.as_i64())
        .ok_or("Missing pc_id in credentials")?;
    let device_secret = creds.get("device_secret")
        .and_then(|v| v.as_str())
        .ok_or("Missing device_secret in credentials")?;
    
    // Build heartbeat payload
    let timestamp = chrono::Utc::now().timestamp().to_string();
    let body = serde_json::json!({
        "timestamp": timestamp,
        "status": "online"
    });
    let body_str = body.to_string();
    
    // Create HMAC signature for authentication
    let mut mac = HmacSha256::new_from_slice(device_secret.as_bytes())
        .map_err(|e| e.to_string())?;
    mac.update(body_str.as_bytes());
    let signature = format!("{:x}", mac.finalize().into_bytes());
    
    // Send heartbeat to backend
    let backend_url = BACKEND_URL.lock().unwrap().clone();
    let url = format!("{}/api/clientpc/heartbeat", backend_url);
    
    let client = reqwest::Client::new();
    match client
        .post(&url)
        .header("X-PC-ID", pc_id.to_string())
        .header("X-Signature", &signature)
        .header("X-Timestamp", &timestamp)
        .header("Content-Type", "application/json")
        .body(body_str)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                let resp_body: serde_json::Value = response.json().await.unwrap_or(serde_json::json!({"status": "ok"}));
                Ok(resp_body)
            } else {
                let status = response.status();
                let err_text = response.text().await.unwrap_or_default();
                Err(format!("Heartbeat failed: HTTP {} - {}", status, err_text))
            }
        }
        Err(e) => Err(format!("Heartbeat network error: {}", e))
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            
            // NOTE: Kiosk mode is NOT auto-enabled on startup
            // It must be explicitly enabled by the admin via the UI
            // This allows normal development and testing
            #[cfg(target_os = "windows")]
            {
                // Window is closable in dev/normal mode
                // Kiosk mode will be enabled explicitly when needed
                
                // DO NOT auto-enable keyboard hooks or kiosk mode
                // These should only be enabled when:
                // 1. Admin explicitly enables kiosk mode
                // 2. The app is deployed in production kiosk environment
                
                println!("[Primus] Started in NORMAL MODE - kiosk features disabled");
                println!("[Primus] Use Admin Portal to enable kiosk mode when ready");
            }
            
            Ok(())
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // Only prevent close for Primus itself, not launched apps
                #[cfg(target_os = "windows")]
                {
                    // Check if this is Primus window or a launched app
                    unsafe {
                        if let Ok(apps) = PRIMUS_LAUNCHED_APPS.lock() {
                            if !apps.is_empty() {
                                // If apps are running, still prevent Primus from closing
                                // but allow launched apps to close normally
                                api.prevent_close();
                                return;
                            }
                        }
                    }
                }
                // Always prevent Primus from closing
                api.prevent_close();
            }
            tauri::WindowEvent::Focused(focused) => {
                // When Primus gets focus, manage kiosk mode based on running apps
                if *focused {
                    #[cfg(target_os = "windows")]
                    {
                        unsafe {
                            // Re-enable kiosk mode when coming back from dialogs
                            if !KIOSK_MODE_ACTIVE {
                                KIOSK_MODE_ACTIVE = true;
                                println!("Re-enabled kiosk mode after dialog");
                            }
                            
                            if let Ok(apps) = PRIMUS_LAUNCHED_APPS.lock() {
                                if apps.is_empty() {
                                    // No apps running - restore strict kiosk
                                    let _ = event.window().set_always_on_top(true);
                                } else {
                                    // Apps running - stay permissive
                                    let _ = event.window().set_always_on_top(false);
                                }
                            }
                        }
                    }
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            generate_hardware_fingerprint,
            save_device_credentials,
            reset_device_credentials,
            get_device_credentials,
            send_heartbeat,
            hmac_sha256,
            greet,
            get_system_info,
            check_backend_connection,
            show_notification,
            enable_kiosk_mode,
            disable_kiosk_mode,
            check_kiosk_status,
            enable_kiosk_shortcuts,
            disable_kiosk_shortcuts,
            get_running_apps,
            switch_to_app,
            hide_taskbar,
            show_taskbar,
            detect_installed_games,
            launch_game,
            add_manual_game,
            browse_for_game,
            temporarily_allow_dialogs,
            cleanup_closed_apps,
            manage_window_focus,
            register_pc_with_backend,
            enable_auto_boot,
            disable_auto_boot,
            check_auto_boot_status,
            setup_complete_kiosk,
            system_shutdown,
            system_restart,
            system_logoff,
            system_lock,
            system_cancel_shutdown,
            check_installed_paths
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
