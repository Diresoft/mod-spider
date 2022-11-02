import { goto } from "$app/navigation";

export function btnAnchor( url : string | URL ) { return () => goto( url ); }