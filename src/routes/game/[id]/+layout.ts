import type { Game } from "$lib/database/objects/Game";
import { liveQuery } from "dexie";
import type { LayoutLoad } from "./$types"
import { global_db } from "$lib/database/db";
import { redirect } from "@sveltejs/kit";
import type { Readable } from "svelte/motion";

export async function load( {params} ) {
    const game_id: number = parseInt( params.id ); // Game ID is stored as a number in Dexie, but page params are strings so cast it
    
    if( await global_db.games.get( game_id ) === undefined ) {
        throw redirect( 302, '/' ); // Game not in database, redirect to homepage
    }
    return {
        game_id,
        game_store: liveQuery( async () => await global_db.games.get( game_id ) ) as any as Readable<Game>
    }
}