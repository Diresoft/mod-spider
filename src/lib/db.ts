
/// Database Version Number
const VERSION = 1;

// Database Migration Table
const MIGRATIONS = {
	1: ( db: IDBDatabase ) => {
		db.createObjectStore( 'plans', { keyPath: 'name' } )
	}
}

export class ObjectStore<T>
{
	
}

export class Database
{
	protected db: Promise<IDBDatabase>;
	constructor( game_name: string )
	{
		let onOpen, onError;
		this.db = new Promise( (res, rej) => { onOpen = res; onError = rej } );

		const open_request = window.indexedDB.open( `db_${game_name}_mod_planner`, VERSION );
		open_request.onerror = ( event ) => {
			onError( event );
		}
		open_request.onsuccess = ( _ ) => {
			onOpen( open_request.result );
		}
		open_request.onupgradeneeded = ( event ) => {
			const db = (event.target as IDBOpenDBRequest).result;
			db.onerror = ( event ) => {
				onError( event );
			}

			for( let i = event.oldVersion; i < event.newVersion; ++i )
			{
				const migration = MIGRATIONS[ i ];
				if ( migration === undefined ) {
					console.warn( `Missing migration for DB version ${i}` );
				}
				migration( db );
			}

			onOpen( db );
		}
	}
}