#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// BEGIN - Example of how to create a window with an "Initialization Script"
// I can leverage this method to inject custom Javascript into a Nexusmods webpage
// Pros:
// - Can browse directly on their site and intercept clicks to add/track/download mods
// - Can inject an auto scraper on a modpage that's easier to use than parsing HTML
// Cons:
// - Have to deal with Ads on the Nexus site

// use tauri::{WindowBuilder, Runtime};

// const INIT_SCRIPT: &str = r#"
//     console.log("hello world from js init script");
// "#;

// #[tauri::command]
// async fn open_docs(handle: tauri::AppHandle) {
//   let docs_window = tauri::WindowBuilder::new(
//     &handle,
//     "external", /* the unique window label */
//     tauri::WindowUrl::External("https://www.nexusmods.com/".parse().unwrap())
//   )
//   .initialization_script( INIT_SCRIPT )
//   .build()
//   .unwrap();
// }
// fn main() {
// 	tauri::Builder::default()
//     .invoke_handler(tauri::generate_handler![open_docs])
// 	.run(tauri::generate_context!())
// 	.expect("error while running tauri application");
// }

// END - Example of how to create a window with an "Initialization Script"

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
