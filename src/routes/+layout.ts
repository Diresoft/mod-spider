import { PUBLIC_TAURI_DEV } from '$env/static/public'

export const prerender = true
export const ssr = PUBLIC_TAURI_DEV === 'true' // TODO: To build the app this should be `false`. For some reason PUBLIC_TAURI_DEV appears to not be exported by $env/static/public at that time