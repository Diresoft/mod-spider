import Dexie, { type DBCore, type DBCoreAddRequest, type DBCoreMutateRequest, type DBCorePutRequest, type DBCoreTable, type DBCoreTransaction, type DbCoreTransactionOptions, type IndexableType, type IntervalTree, type ObservabilitySet, type Table } from "dexie";
import type { Class, PartialMap } from "../util/types";

export type TablesOf<D extends Dexie> = { [K in keyof D]: D[K] extends Table<any> ? K : never }[keyof D];
export type TableTypeMap<D extends Dexie> = { [name in TablesOf<D>]: Class<any> };


export interface RangeSet
{
	add( rangeSet: IntervalTree | {from: IndexableType, to: IndexableType} ): RangeSet
	addKey( key: IndexableType ): RangeSet;
	addKeys( keys: IndexableType[] ): RangeSet;
}
export let RangeSet: undefined|(new(...args:any[]) => RangeSet) = undefined;

export type DexieUtilsForeignKeyMetadata =
{
	foreign_table_name: string
}
export type DexieUtilsFieldMetadata<T=any> =
{
	Prop: keyof T,
	Type?: Class<any>
}
export type DexieUtilsClassMetadata<T=any> =
{
	Fields: PartialMap<T, DexieUtilsFieldMetadata<T>>
	ForeignEntities: PartialMap<T, DexieUtilsForeignKeyMetadata>
}

export class DexieUtils {
	// Internal
	protected static metadata: Map<Class<any>, DexieUtilsClassMetadata> = new Map();

	// Constants
	public static readonly ClassMetadataSymbol: unique symbol = Symbol("@@DexieUtils::ClassMetadata");

	// Utility
	public static ComputePrimKeyForTable<T extends Object>( target: T, table: Table<T> ): IndexableType|undefined
	{
		const key_path = table.schema.primKey.keyPath;
		if ( key_path === undefined ) throw new SyntaxError(`Primary key path for table \`${table.name}\` was undefined` );

		if ( !Array.isArray( key_path ) ) return Reflect.get( target, key_path    ) as IndexableType | undefined;
		else if( key_path.length <= 1 )   return Reflect.get( target, key_path[0] ) as IndexableType | undefined;
		else {
			let cur_key;
			let cur_obj: Object|IndexableType|undefined = target;
			do {
				cur_key = key_path.unshift();
				cur_obj = Reflect.get( target, cur_key ) as IndexableType | Object | undefined;
			} while( cur_key !== undefined && cur_obj !== undefined );
			return cur_obj as IndexableType|undefined;
		}
	}

	public static GetClassInfo<T>( constructor: Class<T>, allow_create: boolean = false ): DexieUtilsClassMetadata|undefined
	{
		let out: DexieUtilsClassMetadata<T>|null;
		//if ( !Reflect.hasMetadata( DexieUtils.ClassMetadataSymbol, constructor ) )
		if ( !DexieUtils.metadata.has( constructor ) && allow_create )
		{
			out = { Fields: {}, ForeignEntities: {} };
			// Reflect.defineMetadata( DexieUtils.ClassMetadataSymbol, out, constructor );
			DexieUtils.metadata.set( constructor, out );
		}
		else if ( !DexieUtils.metadata.has( constructor ) ) return undefined;
		else
		{
			//out = Reflect.getMetadata( DexieUtils.ClassMetadataSymbol, constructor ) as DexieUtilsClassMetadata<T>;
			out = DexieUtils.metadata.get( constructor ) as DexieUtilsClassMetadata<T>;
		}
		return out;
	}

	// Decorators

	/**
	 * Decorates the following property as one which should have the same prototype
	 * of the specified constructor
	 * @param type Class constructor type for this property
	 */
	public static MapType<T extends Object, C>( type: Class<C> ): PropertyDecorator
	{
		return function( prototype: T, prop: keyof T )
		{
			const info = DexieUtils.GetClassInfo( prototype.constructor as Class<T>, true ) as DexieUtilsClassMetadata;
			info.Fields[prop] = {
				Prop: prop,
				Type: type
			}
		} as PropertyDecorator
	}

	/**
	 * Decorates the following property as a foreign object which is stored/revived from a different
	 * table than the object it resides in.
	 * @param table_name Name of the table the following property should be stored in
	 * @param primary_key_property Property name of the following property's primary key in it's table
	 */
	public static Foreign<T>( table_name: string ): PropertyDecorator
	{
		return function<P extends Object>( prototype: P, prop: keyof T )
		{
			const info = DexieUtils.GetClassInfo( prototype.constructor as Class<T>, true ) as DexieUtilsClassMetadata
			info.ForeignEntities[ prop ] = {
				foreign_table_name: table_name
			}
		} as PropertyDecorator
	}

	// Helpers

	public static GetMappedTypesFor<T extends Object>( instance: T )
	{
		const constructor = instance.constructor as Class<T>;
		const info = this.GetClassInfo( constructor, true ) as DexieUtilsClassMetadata;
		return info.Fields;
	}

	public static HydrateSubtypes<T extends Object>( obj: T ): T
	{
		const fields = DexieUtils.GetMappedTypesFor( obj );
		for( const { Prop, Type } of Object.values( fields ) as DexieUtilsFieldMetadata<T>[] )
		{
			if ( Type === undefined ) continue; // No type info to hydrate with
	
			const data = obj[Prop];
			if ( typeof data === 'object' && !(data instanceof Type) )
			{
				// Re-create this sub-element with the correct prototype
				obj[Prop] = Object.create( Type.prototype, Object.getOwnPropertyDescriptors( data ) );
	
				// Ensure the sub object is hydrated as well
				DexieUtils.HydrateSubtypes( obj[Prop] as Object );
			}
		}
		return obj;
	}
	
	/**
	 * Dexie doesn't expose the RangeSet type. However, it's prototype can be found in the
	 * argument provided to the `storagemutated` callback. This is a pretty ugly hack to cache
	 * that prototype so we can construct our own `RangeSet` types
	 * 
	 * It works by subscribing to the `storagemutated` event, then triggering a mutate event
	 * that shouldn't make a permanent change to the database.
	 * This transaction will still generate the required event. From there we can slurp up
	 * the prototype for the mutated parts as our `RangeSet` prototype.
	 */
	
	public static HACK_ConstructType_RangeSet( db: Dexie, table: Table<any>, sample_data: any ): void
	{
		function handler( changedParts: ObservabilitySet )
		{
			// @ts-expect-error
			RangeSet = Reflect.getPrototypeOf( Object.values( changedParts )[0] ).constructor;
		}
		Dexie.on( 'storagemutated', handler );
		db.transaction( 'rw', table, async () => {
			const key = await table.add( sample_data );
			table.delete( key );
		}).then( () => {
			Dexie.on( 'storagemutated' ).unsubscribe( handler );
		})
	}

	public static ConfigureMiddleware<D extends Dexie>( db: D ): void
	{
		type fk_info<T=any> = {
			table: Table<T>,
			metadata: DexieUtilsClassMetadata<T>,
			mapped_class: Class<T>
			required_tables: Array<string>
		}
		// Pre-compute foreign key trees for all of the table types in db
		const table_info = new Map<string, fk_info>();
		const buffer = db.tables.map( t => t.name );

		let next;
		while( (next = buffer.shift()) !== undefined  )
		{
			const table = db.table( next );

			const mapped_class = table.schema.mappedClass as undefined | Class<any>;
			// const metadata = Reflect.getMetadata( DexieUtils.ClassMetadataSymbol, mapped_class ?? {}) as undefined | DexieUtilsClassMetadata;
			const metadata = DexieUtils.metadata.get( mapped_class as Class<any> ) as undefined | DexieUtilsClassMetadata;
			if ( mapped_class === undefined || metadata === undefined ) continue; // Can't do anything with this table

			table_info.set( table.name, {
				table,
				metadata,
				mapped_class,
				required_tables: []
			})
		}

		// Walk the table trees to determine what store names are required for each top level table.
		function collect_fk_tables( cur_info: fk_info, seen_tables: Set<String> ): void
		{
			seen_tables.add( cur_info.table.name );
			for( const { foreign_table_name } of Object.values(cur_info.metadata.ForeignEntities ) as DexieUtilsForeignKeyMetadata[] )
			{	
				if ( seen_tables.has( foreign_table_name ) ) continue;
				seen_tables.add( foreign_table_name );
				const info = table_info.get( foreign_table_name );
				if ( info === undefined ) throw new Error( `Table \`${foreign_table_name}\` was seen while collecting table names, but had no info` );
				collect_fk_tables( info, seen_tables );
			}
		}
		for( const table of db.tables )
		{
			const info = table_info.get( table.name ) as fk_info;
			let seen_tables = new Set<string>();
			collect_fk_tables( info, seen_tables );
			info.required_tables = Array.from( seen_tables );
		}

		function as_promise<T>( req: IDBRequest<T> ): Promise<T>
		{
			return new Promise( ( res, rej ) => {
				req.addEventListener( 'success', () => {
					res( req.result );
				});
				req.addEventListener( 'error', () => {
					rej( req.error );
				});
			});
		}
		db.use({ stack: 'dbcore', name: 'DireDexieMiddleware', level: -1,
			create( downlevel_database: DBCore ): Partial<DBCore>
			{
				return { ...downlevel_database,
					transaction( stores: string[], mode: 'readonly' | 'readwrite', options?: DbCoreTransactionOptions ): DBCoreTransaction
					{
						// Expand the set of stores in the transaction to include all required stores from FKs for the original tables needed
						const all_stores = new Set<string>( stores );
						for( const store of stores )
						{
							// Add FKs
							const info = table_info.get( store );
							if ( info === undefined ) continue;
							for( const fk_store of info.required_tables )
							{
								all_stores.add( fk_store );
							}
						}

						const out = downlevel_database.transaction( Array.from( all_stores ), mode, options );
						return out;
					},
					table( table_name ): DBCoreTable {
						const downlevel_table = downlevel_database.table( table_name );
						const info = table_info.get( table_name );
						if ( info === undefined ) return downlevel_table;

						return { ...downlevel_table,
							// async get( req: DBCoreGetRequest ) {
							// 	return downlevel_table.get( req ).then( async res => {
							// 		console.log( `Get start:`, req );
							// 		const transaction = req.trans as IDBTransaction;
							// 		// We need to pull in the FKs from their component tables, recursively
							// 		const pulled_objects = new Map<IndexableType, any>();
							// 		const buffer: Array<{
							// 			obj: any,
							// 			info: fk_info
							// 		}> = [ { obj: res, info } ];
							// 		let cur;
							// 		while( ( cur = buffer.shift() ) !== undefined )
							// 		{
							// 			for( const [ prop, { foreign_table_name } ] of Object.entries( cur.info.metadata.ForeignEntities ) as [ keyof Object, DexieUtilsForeignKeyMetadata ][] )
							// 			{
							// 				const fk_key = cur.obj[ prop ];
							// 				if ( fk_key === null || fk_key === undefined ) continue;

							// 				if ( Array.isArray( fk_key ) )
							// 				{
							// 					for( let i = 0; i < fk_key.length; ++i )
							// 					{
							// 						let fk_obj = pulled_objects.get( fk_key[i] );
							// 						if ( fk_obj === undefined )
							// 						{
							// 							// Intentionally bypass Dexie here. We want to avoid invoking our own middleware again.
							// 							// Yeah, I know that's fragile, but it works for now and I need to move on

							// 							fk_obj = await Dexie.waitFor( as_promise( transaction.objectStore( foreign_table_name ).get( fk_key[i] ) ) );

							// 							// console.log( `Pull ${fk_key[i]} from ${foreign_table_name}` );
							// 							// fk_obj = await db.table( foreign_table_name ).get( fk_key[i] );

							// 							pulled_objects.set( fk_key[i], fk_obj );

							// 							// If we have metadata for this table, ensure we process this sub-type
							// 							const fk_info = table_info.get( foreign_table_name );
							// 							if ( fk_info !== undefined )
							// 							{
							// 								// Hydrate the type
							// 								fk_obj = Object.create( fk_info.mapped_class.prototype, Object.getOwnPropertyDescriptors( fk_obj ));
							// 								buffer.push({ obj: fk_obj, info: fk_info } );
							// 							}

							// 							pulled_objects.set( fk_key[i], fk_obj );
							// 						}
							// 						cur.obj[ prop ][i] = fk_obj;
							// 					}
							// 				}
							// 				else
							// 				{
							// 					let fk_obj = pulled_objects.get( fk_key );
							// 					if ( fk_obj === undefined )
							// 					{
							// 						// Intentionally bypass Dexie here. We want to avoid invoking our own middleware again.
							// 						// Yeah, I know that's fragile, but it works for now and I need to move on

							// 						fk_obj = await Dexie.waitFor(  as_promise( transaction.objectStore( foreign_table_name ).get( fk_key ) ) );

							// 						// console.log( `Pull ${fk_key} from ${foreign_table_name}` );
							// 						// fk_obj = await db.table( foreign_table_name ).get( fk_key );

							// 						pulled_objects.set( fk_key, fk_obj );
							// 						// Push this object into the queue to retrieve it's FKs
							// 						const fk_info = table_info.get( foreign_table_name );
							// 						if ( fk_info !== undefined )
							// 						{
							// 							// Hydrate the type
							// 							fk_obj = Object.create( fk_info.mapped_class.prototype, Object.getOwnPropertyDescriptors( fk_obj ));

							// 							buffer.push({ obj: fk_obj, info: fk_info } );
							// 						}
							// 					}
							// 					cur.obj[ prop ] = fk_obj;
							// 				}
							// 			}
							// 		}
							// 		console.log( `Get end:`, req );
							// 		return res;
							// 	});
							// },
							async mutate( req: DBCoreMutateRequest ) {
								if ( req.type !== 'add' && req.type !== 'put' ) return downlevel_table.mutate( req ); // Only interested in put and add

								//console.log( `Mutate start:`, req );

								// Fix types and get a reference to the IDBTransaction
								req = req as DBCoreAddRequest|DBCorePutRequest; // Inform Typescript of the narrowed type
								const transaction = req.trans as IDBTransaction;
							
								// Collect all objects which will be sent to different tables
								type fk_write_info = {
									obj: any;           // What to write
									table_name: string; // Table to write to
									users: Array<{      // Where this object was referenced. These will need to have their property changed to the key value, then be written again
										user: any;		// The user of this data
										table: string;  // Table the user belongs to
										callback: ( key: IndexableType ) => void; // Callback the user can use to set it's own property to the specified key
										restore?: () => void;
									}>;
								};
								const process_buffer: Array<{obj: any, info: fk_info}> = req.values.map( v => { return { obj: v, info }; } );
								const write_map: Map<any, fk_write_info> = new Map();
								
								// Phase 1: Emit objects to write
								let cur_val;
								while( ( cur_val = process_buffer.shift() ) !== undefined )
								{
									const { obj, info } = cur_val;

									for( const [ prop, { foreign_table_name } ] of Object.entries(info.metadata.ForeignEntities) as [ keyof Object, DexieUtilsForeignKeyMetadata ][] )
									{
										const fk_obj = obj[ prop ];
										if ( typeof fk_obj !== 'object' || fk_obj === undefined || fk_obj === null ) continue; // Can't write as FK

										if( Array.isArray( fk_obj ) )
										{
											for( let i = 0; i < fk_obj.length; ++i )
											{
												const fk_obj_entry = fk_obj[ i ];
												let write_info = write_map.get( fk_obj_entry );
												if ( write_info === undefined )
												{
													write_info = {
														obj: fk_obj_entry,
														table_name: foreign_table_name,
														users: []
													}
													write_map.set( fk_obj_entry, write_info );
	
													// If this object has it's own FKs, we'll need to process them. If there's metadata, push it into the process list.
													const fk_info = table_info.get( foreign_table_name )
													if ( fk_info !== undefined )
													{
														process_buffer.push( {
															obj:  fk_obj_entry,
															info: fk_info
														} );
													}
												}
												write_info.users.push({
													user: obj,
													table: info.table.name,
													callback( key ) {
														obj[ prop ][ i ] = key;
													},
													restore() {
														obj[ prop ][ i ] = fk_obj_entry; // Restore this object's original value for this property
													}
												})
												//obj[ prop ][ i ] = undefined; // Clear the reference for now to avoid walking down into it again
											}
										}
										else
										{
											let write_info = write_map.get( fk_obj );
											if ( write_info === undefined )
											{
												write_info = {
													obj: fk_obj,
													table_name: foreign_table_name,
													users: []
												}
												write_map.set( fk_obj, write_info );

												// If this object has it's own FKs, we'll need to process them. If there's metadata, push it into the process list.
												const fk_info = table_info.get( foreign_table_name )
												if ( fk_info !== undefined )
												{
													process_buffer.push( {
														obj:  fk_obj,
														info: fk_info
													} );
												}
											}
											write_info.users.push({
												user: obj,
												table: info.table.name,
												callback( key ) {
													obj[ prop ] = key;
												},
												restore() {
													obj[ prop ] = fk_obj; // Restore this object's original value for this property
												}
											})
											//obj[ prop ] = undefined; // Clear the reference for now to avoid walking down into it again
										}
									}
								}

								// Phase 2: Write all unique objects to the database
								const objects_updated = new Map<any, {obj: any, table: string}>();
								const seen_keys = new Map<string, Set<IndexableType>>();
								for( const info of write_map.values() )
								{
									await Dexie.waitFor( as_promise( transaction.objectStore( info.table_name ).put( info.obj ) ) )
									.then( key => {
										const key_list = seen_keys.get( info.table_name ) ?? new Set();
										key_list.add( key as IndexableType );
										seen_keys.set( info.table_name, key_list )
										for( const { user, table, callback } of info.users )
										{
											callback( key as IndexableType );
											objects_updated.set( user, {
												obj:   user,
												table: table
											})
										}
									});
								}
								
								// Phase 3: Write the objects who's keys we changed. They might have already been written, but since
								//          we wouldn't have had the foreign key value at that time, we had to update it a second time
								for( const updated of objects_updated.values() )
								{
									if ( req.values.includes( updated.obj ) ) continue; // Skip objects which were in the original transaction. Let it write the final state of those
									await Dexie.waitFor( as_promise( transaction.objectStore( updated.table ).put( updated.obj ) ) );
								}

								// Phase 4: Modify the request to expand the parts of the database we modified
								// @ts-expect-error - Typescript doesn't know about this property
								const mutatedParts = req.trans.mutatedParts as { [part: string]: RangeSet|undefined };
								if ( mutatedParts !== undefined && RangeSet !== undefined )
								{
									for( const [ table_name, keys ] of seen_keys.entries() )
									{
										const uri	   = `idb://${db.name}/${table_name}/`;
										const uri_dels = `idb://${db.name}/${table_name}/:dels`;

										const range_set	     = mutatedParts[ uri ] ?? new RangeSet();
										const range_set_dels = mutatedParts[ uri_dels ] ?? new RangeSet();

										range_set     .addKeys( Array.from( keys ) );
										range_set_dels.addKeys( Array.from( keys ) );

										mutatedParts[ uri ]      = range_set;
										mutatedParts[ uri_dels ] = range_set_dels;
									}
									console.log( `Changed req:`, mutatedParts, `\n`, req );
								}
								else if ( mutatedParts === undefined )
								{
									console.error( `Expected request to have \`mutatedParts\` on it's transaction, but it didn't`, req );
								}

								//console.log( `Mutate end:`, req );
								return downlevel_table.mutate( req );
							}
						}
					}
				}
			}
		})
	}
}