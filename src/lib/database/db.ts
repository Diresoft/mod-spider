import Dexie, { type Table } from 'dexie';
import type { ModPlan } from './objects/ModPlan';
import type { Mod } from './objects/Mod';
import type { Game } from './objects/Game';
import { writable, type Writable } from 'svelte/store';

export class GlobalDatabase extends Dexie {
    games !: Table<Game>;

    constructor() {
        super( 'mp-games' );
        this.version( 1 ).stores({
            games: '++id'
        })
    }
}
export const global_db = new GlobalDatabase();

export class GameDatabase extends Dexie {
    plans !: Table<ModPlan>;
    mods  !: Table<Mod>;

    constructor( game_id: number ) {
        super( `mp-game-${game_id}` );
        this.version( 1 ).stores({
            plans: '++id, title',
            mods:  '++id, title'
        })
    }
}
export const game_db: Writable<GameDatabase | undefined> = writable();
export function setGame( game: Game ) {
    if( game.id === undefined ) throw new Error("")
    game_db.set( new GameDatabase( game.id ) );
}