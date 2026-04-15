// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // WebKitGTK rendering workaround for Wayland/GPU issues.
    // DMABUF: blank windows on some compositors (Hyprland) due to EGL errors.
    #[cfg(target_os = "linux")]
    {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        // Required on Linux with large RAM/swap: WebKitGTK compositor pre-allocates
        // ~25% of total virtual memory (RAM+swap) for its tile cache. On a 14GB RAM +
        // 19GB swap system this is ~4 GB, filling all RAM and freezing the machine.
        // Software rendering is slower but memory-safe. Fix: reduce swap or implement
        // virtual scrolling (fewer compositor layers).
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    }

    vega_lib::run()
}
