use tauri::Manager;
use window_shadows::set_shadow;

#[tauri::command]
async fn set_window_shadow( app: tauri::AppHandle, shadow_state: bool )
{
	let window = app.get_window( "MOD_SPIDER_DB_WINDOW" ).unwrap();
	set_shadow( &window, shadow_state ).expect( "window-shadows: unsupported platform!" );
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
	.setup(|app| {
		let window = app.get_window( "main" ).unwrap();
		set_shadow( &window, true ).expect( "Window-Shadows: Unsupported platform!" );
		#[cfg(debug_assertions)] // Only include code on debug builds
		{
			let window = app.get_window("main").unwrap();
			window.open_devtools(); // Open devtools on debug builds by default
		}
		Ok(())
	})
	.invoke_handler(tauri::generate_handler![set_window_shadow])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
