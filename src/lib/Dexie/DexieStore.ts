// DexieStore.ts
// Readable and Writable stores which honor and track foreign key markers.

import Dexie, { liveQuery, type IndexableType, type Observable, type PromiseExtended, type Table } from "dexie";
import type { Readable, Subscriber, Unsubscriber, Updater, Writable } from "svelte/store";
import { DexieUtils, type DexieUtilsClassMetadata, type DexieUtilsForeignKeyMetadata } from "./DexieUtils";
import type { Class } from "./types";


// == TYPES ==

type TableForeignKeyInfo<T> = 
{
	table:          Table<any>;
	metadata?:      DexieUtilsClassMetadata<T>;
	mapped_class?:  new ( ...args: unknown[] ) => T;
	subtables:      Array<Table<any>>;
}

type Querier<T> = () => T | Promise<T | undefined> | undefined;
type Putter<T> = ( val: T ) => Promise<void>;

// == STATE ==
const cached_table_info = new Map< string, TableForeignKeyInfo<any> >();
const cached_stores	    = new Map<IndexableType, DexieStore<any>>()

// == UTILITY / HELPER ==
/**
 * Parses the defined foreign entity metadata for the provided table. Will recursively collect
 * info for all the foreign entity's tables as well.
 * @param table Dexie table to gather info for
 * @returns A recursive description of the provided table's foreign entities and their table's info
 */
function TableFKInfo<T>( table: Table<any> ): TableForeignKeyInfo<T>
{
	const self_db = table.db;
	if ( cached_table_info.has( table.name ) ) return cached_table_info.get( table.name ) as TableForeignKeyInfo<T>;

	// Basic info about type
	const mapped_class = table.schema?.mappedClass as new ( ...args: unknown[] ) => T;
	const subtable_map = new Map<string, Table<any>>();
	let metadata = undefined;
	if ( mapped_class !== undefined )
	{
		metadata = DexieUtils.GetClassInfo( mapped_class as Class<T> );
		if ( metadata !== undefined )
		{
			// Recursively search the FK entity types
			let buffer = Object.values( metadata.ForeignEntities ) as DexieUtilsForeignKeyMetadata[];
			let cur;
			while( ( cur = buffer.shift() ) !== undefined )
			{
				const { foreign_table_name } = cur;
				if ( subtable_map.has( foreign_table_name ) ) continue; // Already seen this map

				const fk_table = self_db.table( foreign_table_name );
				if ( fk_table === undefined ) throw new Error( `\`${foreign_table_name}\` is not a table in \`${self_db.name}\`` );
				
				subtable_map.set( foreign_table_name, fk_table );
				buffer.push( { foreign_table_name } );
			}
		}
	}

	// Construct return type
	const out: TableForeignKeyInfo<T> = {
		table,
		mapped_class,
		metadata,
		subtables: Array.from( subtable_map.values() )
	};
	cached_table_info.set( table.name, out as TableForeignKeyInfo<T> );
	return out as TableForeignKeyInfo<T>;
}

async function ExpandQueryToForeignKeys<T>( querier: Querier<T>, table: Table<T> ): Promise<T|undefined>
{
	const my_db = table.db;
	const self: T|undefined = await querier()
	if ( self === undefined ) return self;

	const cached = new Map<IndexableType, any>();
	const scan_buffer: Array<any> = [];

	// Seed with self
	scan_buffer.push( { obj: self, table_name: table.name } );

	let cur: { obj: any, table_name: string };
	while( ( cur = scan_buffer.shift() ) !== undefined )
	{
		const fk_table = my_db.table( cur.table_name );
		
		const fk_table_info = TableFKInfo( fk_table );
		if ( fk_table_info.metadata === undefined || fk_table_info.mapped_class === undefined ) continue;

		for( const [prop, { foreign_table_name }] of Object.entries( fk_table_info.metadata.ForeignEntities ) as [ keyof Object, DexieUtilsForeignKeyMetadata ][])
		{
			if ( cur.obj === undefined || cur.obj === null ) continue;

			const fk_val = cur.obj[ prop ];
			if ( fk_val === undefined || fk_val === null ) continue;
			
			if ( Array.isArray( fk_val ) )
			{
				for( let i = 0; i < fk_val.length; ++i )
				{
					const fk_val_entry = fk_val[i];
					let fk_ent = cached.get( fk_val_entry );
					if ( fk_ent === undefined )
					{
						fk_ent = await my_db.table( foreign_table_name ).get( fk_val_entry );
						cached.set( fk_val_entry, fk_ent );
						// Add this object to the buffer
						scan_buffer.push( { obj: fk_ent, table_name: foreign_table_name } );
					}
					cur.obj[ prop ][ i ] = fk_ent;
				}
			}
			else
			{
				let fk_ent = cached.get( fk_val );
				if ( fk_ent === undefined )
				{
					fk_ent = await my_db.table( foreign_table_name ).get( fk_val );
					cached.set( fk_val, fk_ent );
					scan_buffer.push( { obj: fk_ent, table_name: foreign_table_name } );
				}
				cur.obj[ prop ] = fk_ent;
			}
		}
	}

	return self;
}

// == IMPLEMENTATION ==
class DexieStore<T extends Object> implements DexieWritable<T>
{
	// == Factory Method ==
	public static Get<T extends Object>( table: Table<T>, querier_or_key: Querier<T>|IndexableType, putter?: Putter<T> ): DexieStore<T>
	{
		let querier: Querier<T>;
		let prim_key: IndexableType|undefined = undefined;
		if ( typeof querier_or_key !== 'function' )
		{
			prim_key = querier_or_key;

			// We have a key, see if we can re-use an existing instance
			// TODO: Handle cases where the cached store is wrapping a different type?
			if( cached_stores.has( prim_key ) ) return cached_stores.get( prim_key ) as DexieStore<T>;

			// We're going to need to create a new instance, which will need a querier. Search for the provided indexable type
			querier = () => table.get( querier_or_key as IndexableType );
		}
		else
		{
			querier = querier_or_key;
		}
		
		if ( putter === undefined )
		{ // Default implementation is just a simple `table.put`
			putter = ( val: T ) => table.put( val );
		}

		let out = new DexieStore<T>( table, querier, putter );
		if ( prim_key !== undefined ) cached_stores.set( prim_key, out );
		return out;
	}

	// == Dexie Integration ==
	protected table: Table<T>;
	protected putter: Putter<T>;
	protected observed?: Observable<T|undefined>;
	protected observed_value?: T;
	protected observed_prim_key?: IndexableType;
	protected dexie_onChange( value: T|undefined )
	{
		this.observed_value = value;
		if ( this.observed_value !== undefined )
		{
			if ( this.observed_prim_key === undefined )
			{
				this.observed_prim_key = DexieUtils.ComputePrimKeyForTable( this.observed_value, this.table );
				if ( this.observed_prim_key !== undefined )
				{ // Now that we have a primary key, we can cache this store for re-use
					cached_stores.set( this.observed_prim_key, this );
				}
			}
	
			this.broadcast( this.observed_value );
		}
	}

	// == Dire Store Integration ==
	get Value(): T | undefined
	{
		return this.observed_value;
	}

	// == Svelte Store Implementation ==
	protected subscribers = new Set<Subscriber<T>>();
	protected broadcast( value: T )
	{
		for( const run of this.subscribers ) run( value );
	}
	subscribe( run: Subscriber<T> ): Unsubscriber
	{
		this.subscribers.add( run );
		if ( this.observed_value !== undefined ) run( this.observed_value );
		return () => { this.subscribers.delete( run ); }
	}
	set( value: T): void
	{
		// Update this object in the database. The liveQuery we subscribed to will broadcast the change
		// once the DB transaction goes through
		this.putter( value );
	}
	update( updater: Updater<T>): void
	{
		this.set( updater( this.observed_value as T ) );
	}

	constructor( table: Table<T>, querier: Querier<T>, putter: Putter<T> )
	{
		this.putter   = putter;
		this.table    = table;
		this.observed = liveQuery( () => ExpandQueryToForeignKeys( querier, table ) );
		this.observed.subscribe( this.dexie_onChange.bind( this ) );
	}
}

// == PUBLIC API ===
export interface DexieReadable<T extends Object> extends Readable<T>
{
	get Value(): T|undefined;
}
export interface DexieWritable<T extends Object> extends DexieReadable<T>, Writable<T>
{ }

export function dexieReadable<T extends Object>( table: Table<T>, querier:        Querier<T> ): DexieReadable<T>
export function dexieReadable<T extends Object>( table: Table<T>, key:            IndexableType ): DexieReadable<T>
export function dexieReadable<T extends Object>( table: Table<T>, querier_or_key: Querier<T>|IndexableType ): DexieReadable<T>
{
	return DexieStore.Get( table, querier_or_key );
}
export function dexieWritable<T extends Object>( table: Table<T>, querier_or_key: Querier<T>|IndexableType, putter?: Putter<T> ): DexieWritable<T>
{
	return DexieStore.Get( table, querier_or_key, putter );
}