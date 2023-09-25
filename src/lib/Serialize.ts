// == Utility type helpers ==
type ImmutableObject<T>  = { readonly [K in keyof T]: Immutable<T[K]> }
export type Immutable<T> = { readonly [K in keyof T]: T[K] extends Function ? T[K] : ImmutableObject<T[K]> }
export type Class           <T=any> = abstract new (...args: any) => T;
export type OptionalPromise <T>     = Promise<T> | T;


// == JSON type helpers ==
export type JsonKey       = number|string;
export type JsonPrimitive = boolean|number|string|null;
export type JsonKeys<T>   = {
	[K in keyof T]: K extends JsonKey // Only keys which are valid Json keys
		? T[K] extends Function // Only keys who's values are not Functions
			? never
			: K
		: never
}[keyof T];
export type JsonArray<T extends readonly unknown[]> = T extends readonly (infer R)[] ? R : never;
export type JsonType<T=any> = 
// Check if T is an array. Must be first as all Arrays are objects, but not all objects are Arrays
T extends (infer R)[]
	? JsonType<R>[] // Declare an array of JsonTypes matching the inferred array type
	// Check if T is an object of some kind
	: T extends object
		? { [K in JsonKeys<T>]: JsonType< T[K] > } // Declare an object who's keys are the Json safe keys of T, and who's values are JsonTypes of T's member types
		// Check if it's a primitive type JSON supports
		: T extends JsonPrimitive
			? T // Type as is
			: never // Can't exist in a Json type
;
// END JSON type helpers


// == Serialization Utility Types ==

export type SerializeTyped<T=any> = { $$ref: string, $$type: string, $$val?: Immutable<T> };

export type UuidType                       = string;
export type UuidProvider <T extends Class> = ( instance: Immutable< InstanceType<T> > ) => UuidType;

export type TypeConstructor < T extends Class >                 = ( dehydrated : SerializeTyped<JsonType> ) => InstanceType< T >;

export type Dehydrator < T, DT = any > = ( hydrated  : Immutable<T>  ) => Promise< DT >;
export type Hydrator   < T, DT = any > = ( dehydrated: DT            ) => Promise< T  >;

export type SerializableInfo<T extends Class, DT = any > = {
	class:       Class<T>
	name:        string

	typeConstructor  ?: TypeConstructor< InstanceType<T> >
	uuidProvider ?: UuidProvider<T>
	dehydrator   ?: Dehydrator<InstanceType<T>, DT>
	hydrator     ?: Hydrator  <InstanceType<T>, DT>
}

// == Serialization Types ==

export interface DataProvider {
	has   ( uuid: string                                      ): Promise<boolean>;
	put   ( uuid: string, data: SerializeTyped< JsonType >    ): Promise<void>;
	get<T>( uuid: string                                      ): Promise< SerializeTyped< JsonType<T> > >;
}


// == Internal utility and fallback functions ==

function _int_defaultUuidProvider<T extends object>( this: T, target: T ): UuidType
{
	return Reflect.get( this,   "uuid" ) as UuidType
		?? Reflect.get( target, "uuid" ) as UuidType
		?? crypto.randomUUID(); // TODO: this will create different UUIDs on round trips. For things like a Set, where I'm not able to provide a consistent UUID
}
function _int_getUuidFor<T extends Class>( target: Immutable<InstanceType<T>>, meta: SerializableInfo<T> )
{
	return meta.uuidProvider ? meta.uuidProvider.call( target, target ) : _int_defaultUuidProvider.call( target, target );
}
function _int_getMetadataFor<T extends Class>( target: InstanceType<T> ): SerializableInfo<T>
{
	return {
		class:           Reflect.get( target, Serializable.CLASS         ),
		name:            Reflect.get( target, Serializable.TYPENAME      ),
		typeConstructor: Reflect.get( target, Serializable.CONSTRUCTOR   ),
		uuidProvider:    Reflect.get( target, Serializable.UUID_PROVIDER ),
		dehydrator:      Reflect.get( target, Serializable.DEHYDRATOR    ),
		hydrator:        Reflect.get( target, Serializable.HYDRATOR      ),
	}
}

// == Decorator ==
export function Serializable<T extends Class>( options?: Partial< SerializableInfo<T> > )// { hydrator?: TypeHydrator< InstanceType<T> >, dehydrator?: TypeDehydrator< InstanceType<T> > })
{
	return function( target: T, _: unknown )
	{
		Reflect.set( target.prototype, Serializable.CLASS        , target                );
		Reflect.set( target.prototype, Serializable.TYPENAME     , target.name           );
		Reflect.set( target.prototype, Serializable.CONSTRUCTOR  , options?.typeConstructor  );
		Reflect.set( target.prototype, Serializable.UUID_PROVIDER, options?.uuidProvider );
		Reflect.set( target.prototype, Serializable.DEHYDRATOR   , options?.dehydrator   );
		Reflect.set( target.prototype, Serializable.HYDRATOR     , options?.hydrator     );

		// I'm ignoring toJSON for now.

		Serializable.REVERSE_LUT.set( target.name, target );
		if ( options?.uuidProvider === undefined )
		{
			console.warn( `\`${target.name}\` has no UUID provider. Items of this type will not be stored externally` );
		}
		//console.log( `@Serializable -> ${target.name}`, target.prototype );
	}
}

// == Decorator Members ==

// By using different properties for each piece of metadata, the prototype chain lookup will function as expected.
// i.e. you can change one of these in a subclass without having to handle the whole metadata object as a change
Serializable.CLASS         = Symbol( "@@Serializable::CLASS"         );
Serializable.TYPENAME      = Symbol( "@@Serializable::TYPENAME"      );
// Serializable.TO_JSON       = Symbol( "@@Serializable::TO_JSON"       );
Serializable.CONSTRUCTOR   = Symbol( "@@Serializable::CONSTRUCTOR"   );
Serializable.HYDRATOR      = Symbol( "@@Serializable::HYDRATOR"      );
Serializable.DEHYDRATOR    = Symbol( "@@Serializable::DEHYDRATOR"    );
Serializable.UUID_PROVIDER = Symbol( "@@Serializable::UUID_PROVIDER" );

// Provide a static reverse LUT for hydrating from the type name
Serializable.REVERSE_LUT = new Map<string, Class>();

// == CORE TYPE SERIALIZER DATA ==

// # Set
// Serializes to an array of it's contents. Deserializes back into a Set from the array content.
Serializable({
	async dehydrator( hydrated: Immutable<Set<unknown>> ) {
		return Array.from( hydrated.values() )
	},
	async hydrator( dehydrated: Array<unknown> ): Promise< Set<unknown> >
	{
		return new Set( dehydrated );
	}
})(Set, null);


// === DEHYDRATE ===


async function make_operable<T>( original: T ): Promise< JsonType<T> >
{
	const meta = _int_getMetadataFor( original );

	// Create a clone so we can mutate the data
	let clone;
	if( meta.dehydrator !== undefined )
	{
		clone = await meta.dehydrator( original ); // If the user defined a transformer, execute it as the cloning method
	}
	// else if( original instanceof Set )
	// {
	// 	clone = new Set( original );
	// }
	// else if ( original instanceof Map )
	// {
	// 	clone = new Map( original );
	// }
	else if ( Array.isArray( original ) )
	{
		clone = Array.from( original );
	}
	else if ( typeof original === 'object' )
	{
		clone = Object.assign( Object.create( Reflect.getPrototypeOf( original ) ), original );
	}
	else
	{
		clone = original; // Primitive types just need to be assigned
	}

	//console.log( `make_operable\n\tmeta:`, meta, `\n\ttransform:`, original, ` -> `, clone );
	return clone;
}

export type SerializedReference = { $$ref: string, $$type: string                 };
       type _int_dehydrated<T>  = { $$val: T     , $$ref?: string, $$type: string };
async function dehydrate_recursive<T>( item, pending: Map<unknown, Promise<_int_dehydrated<unknown>>>, external: Set<_int_dehydrated<any>>, depth: number = 0 ): Promise<_int_dehydrated<T>>
{
	if ( pending.has( item ) )
	{
		console.log( `Already seen item. Returning existing pending operation`, item );
		return pending.get( item ) as Promise<_int_dehydrated<T>>;
	}

	const clone = await make_operable( item );
	if( Array.isArray( clone ) )
	{
		for( const idx in clone )
		{
			const sub_item = clone[ idx ];
			if ( !Array.isArray( sub_item ) && typeof sub_item !== 'object' ) continue; // Skip primitive types

			clone[idx] = null; // Reserve the spot, but remove the object while we process it to break potential cycles
			let existing = pending.get( sub_item ) as Promise<_int_dehydrated<T>> | undefined;
			if ( existing === undefined ) {
				existing = dehydrate_recursive<typeof sub_item>( sub_item, pending, external, ++depth )
				.then( async ( data ) => {
					if ( "$$ref" in data )
					{
						// Need to add this item to the list of items to write, but we can't serialize it until all promises resolve
						external.add( { $$ref: data.$$ref, $$val: data.$$val, $$type: data.$$type } );
						delete data.$$val;
					}
					return data;
				});
			}
			pending.set(
				sub_item,
				existing.then( ( v ) => {
					clone[idx] = v;
					return v;
				})
			);
		}

		const meta = _int_getMetadataFor( item );
		if ( meta.name !== undefined )
		{
			// It's a specialized type that expressed itself as an array
			return { $$val: clone, $$type: meta.name ?? item.prototype?.name ?? "UNKNOWN_TYPE" };
		}
		else
		{
			return clone;
		}
	}
	else if( typeof clone === 'object' )
	{
		for( const key of Reflect.ownKeys( clone ) )
		{
			const sub_item = Reflect.get( clone, key );
			if ( !Array.isArray( sub_item ) && typeof sub_item !== 'object' ) 
			{
				continue;
			}

			Reflect.set( clone, key, null ); // Remove the item from the parent to break potential cycles

			let existing = pending.get( sub_item ) as Promise<_int_dehydrated<T>> | undefined;
			if ( existing === undefined ) {
				existing = dehydrate_recursive<typeof sub_item>( sub_item, pending, external, ++depth )
				.then( async ( data ) => {
					if ( "$$ref" in data )
					{
						// Need to add this item to the list of items to write, but we can't serialize it until all promises resolve
						external.add( { $$ref: data.$$ref, $$val: data.$$val, $$type: data.$$type } );
						delete data.$$val;
					}
					return data;
				});
			}
			pending.set(
				sub_item,
				existing.then( ( v ) => {
					Reflect.set( clone, key, v );
					return v;
				})
			);
		}

		// Create a reference to the dehydrated object and return that instead.
		const meta = _int_getMetadataFor( item );
		if ( meta.name         === undefined ) return clone; // If we don't have a name for the type, it must not be a special type
		if ( meta.uuidProvider === undefined ) return { $$val: clone, $$type: meta.name } // No UUID provider means we're storing the value in the type itself
		else                                   return { $$val: clone, $$type: meta.name, $$ref: meta.uuidProvider( item ) } // Value will be deleted prior to pushing to data provider
	}
}

Serializable.Dehydrate = async function<T extends object>( instance: T, dataProvider: DataProvider ): Promise<T>
{
	const pending  = new Map();
	const external: Set<_int_dehydrated<any>> = new Set();
	const out = await dehydrate_recursive<T>( instance, pending, external );
	
	// When using Promise.all( pending.values() ) the array is computed at the call. However, as the promises in `pending` execute, more promises get added to the map.
	// Thus, we can't await a static array or anything that gets added more than a promise deep won't be awaited. Instead, use the nature of the iterator returned by
	// `.values()` to continually iterate as long as new entries get added, awaiting each one in turn as it will add the next 
	for( const process of pending.values() )
	{
		await process;
	}

	// Now that all of the promises have completed, we can add all the resulting objects to the data provider
	for( const ext of external.values() )
	{
		dataProvider.put( ext.$$ref, { $$type: ext.$$type, $$val: ext.$$val } as SerializeTyped);
	}

	return out;
}


async function _int_hydrateRecursive( raw_item: { $$type: string, $$val?: any, $$ref?: string }, dataProvider: DataProvider, seen: Map<string, any>, depth: number = 0 ): Promise<any>
{
	if ( depth > 10 ) throw new Error( `Stopping recursion at 4 cycles` );
	const indent = `${'\t'.repeat( depth )}`;

	console.log( `${indent}- Hydrating raw_item:`, raw_item );

	// Retrieve the raw item if working with a reference object
	if ( Reflect.has( raw_item, "$$ref" ) )
	{
		const ref = raw_item.$$ref;
		console.log( `${indent}- raw_item is an external reference` );
		if( seen.has( ref ) )
		{
			raw_item = seen.get( ref );
			console.log( `${indent}\t- Seen before, using existing item` );
		}
		else
		{
			raw_item = await dataProvider.get( ref );
			console.log( `${indent}\t- New reference, pulled from dataProvider` );
			seen.set( ref, raw_item );
		}
	}

	// Next, hydrate any sub references made in these objects
	// The raw item should be either a primitive, object, or an array. So we can handle those edge cases easily
	const { $$type: type, $$val: value, $$ref: ref } = raw_item;
	const sub_item_promises = [];
	if ( typeof value !== 'object' && !Array.isArray( value ) )
	{
		console.log( `${indent}- Value was primitive:`, value );
		// Do Nothing - Type will not be transformed
	}
	else if ( Array.isArray( value ) )
	{
		console.log( `${indent}- Value was array:`, value );
		// Iterate Array to find sub-hydratable types
		for( const [idx, sub_item] of value.entries() )
		{
			if ( sub_item === null || typeof sub_item !== 'object' || !Reflect.has( sub_item, "$$type") )
			{
				console.log( `${indent}\t- Sub item is primitive or untyped, will not hydrate`, sub_item );
				continue;
			}

			console.log( `${indent}\t- Will hydrate array element [${idx}]`, sub_item );
			value[ idx ] = null; // Prevent other references to this from walking into this object
			sub_item_promises.push( _int_hydrateRecursive( sub_item, dataProvider, seen, depth + 1 ).then( (v) =>{
				console.log( `${indent} ==> Finished sub-item hydrate:`, v );
				value[ idx ] = v;
				return v;
			}));
		}
	}
	else
	{
		console.log( `${indent}- Value was object:`, value );
		// Iterate Object Keys to find sub-hydratable types
		for( const key of Reflect.ownKeys( value ) )
		{
			const sub_item = Reflect.get( value, key );
			if ( typeof sub_item !== 'object' || !Reflect.has( sub_item, "$$type") )
			{
				console.log( `${indent}\t- Sub item is primitive or untyped, will not hydrate`, sub_item );
				continue;
			}

			console.log( `${indent}\t- Will hydrate object member [${key.toString()}]:`, sub_item );
			sub_item_promises.push( _int_hydrateRecursive( sub_item, dataProvider, seen, depth + 1 ).then( (v) =>{
				console.log( `${indent} ==> Finished sub-item hydrate:`, v );
				Reflect.set( value, key, v );
				return v;
			}));
		}
	}

	console.log( `${indent}Awaiting all sub-item promises...` );
	await Promise.all( sub_item_promises );
	console.log( `${indent}Done awaiting sub-item promises.`);

	// Next, transform the type based on the hydrator
	const meta = _int_getMetadataFor( Serializable.REVERSE_LUT.get( type ).prototype );
	console.log( `${indent}Hydrating item using metadata`, meta );
	const out = meta.hydrator ? await meta.hydrator( raw_item.$$val ) : Object.assign( Object.create( meta.class.prototype ), raw_item.$$val );

	if ( ref !== undefined )
	{
		seen.set( ref, out );
	}

	return out;
}

async function OLD_int_hydrateRecursive( target: { $$type: string, $$val: JsonType }, dataProvider: DataProvider, seen: Map<string, any>, depth: number = 1 )
{
	if ( depth > 4 ) throw new Error( `Stopping recursion at 4 cycles` );

	const idt = `${'\t'.repeat( depth )}- `;
	const { $$type: type, $$val: item } = target;
	console.log( `${'\t'.repeat( depth - 1 )}- Hydrate< ${type} >`, item );
	
	async function processSubItem( sub_item, cb )
	{
		if ( Array.isArray( sub_item ) )
		{
			console.warn( `${idt}Sub item was array!`, sub_item );
			_int_hydrateRecursive( { $$type: "Array", $$val: sub_item }, dataProvider, seen, depth + 1 );
			cb( sub_item );
		}
		else if ( typeof sub_item === 'object' )
		{
			if ( Reflect.has( sub_item, "$$ref" ) )
			{
				console.log( `${idt}Sub item was external!`, sub_item );
				const ref = sub_item.$$ref;
				delete sub_item.$$ref;
				let existing = seen.get( ref );
				if ( existing === undefined )
				{
					existing = dataProvider.get( ref );
					seen.set( ref, existing );
				}
				
				sub_item = await existing;
			}

			console.log( `${idt}Sub item was object!`, sub_item );
			if ( Reflect.has( sub_item, "$$type" ) )
			{
				console.log( `${idt}\t- Is special type`)

				const type = Serializable.REVERSE_LUT.get( sub_item.$$type );
				const meta = _int_getMetadataFor( type.prototype );

				_int_hydrateRecursive( sub_item, dataProvider, seen, depth + 1 ).then( async (v) => {
					console.log( `${idt}Finished recursive hydrate`, v );
					// Convert it to the full type here
					let out = meta.hydrator ? await meta.hydrator( v ) : Object.assign( Object.create( type ), v );
					cb( out );
				})
			}
			else
			{
				console.log( `${idt}\t- Regular object, doing nothing` )
				cb( sub_item );
			}
		}
		else
		{
			console.log( `${idt}Sub item was primitive`, sub_item );
			cb( sub_item );
		}
	}
	if ( Array.isArray( item ) )
	{
		let idx;
		for( idx = 0; idx < item.length; ++idx )
		{
			const sub_item = item[ idx ];
			item[ idx ] = null;
			processSubItem( sub_item, ( v ) => {
				console.log( `${idt}Processing finished for array item:\n${idt}\t- index: ${idx}\n${idt}\t- value:`, v, `\n${idt}\t- item:`, item );
				item[ idx ] = v;
			})
		}
	}
	else if ( typeof item === 'object' )
	{
		for( const key of Reflect.ownKeys( item ) )
		{
			const sub_item = Reflect.get( item, key );
			Reflect.set( item, key, null );
			processSubItem( sub_item, ( v ) => {
				console.log( `${idt}Processing finished for object member:\n${idt}\t- key: ${key.toString()}\n${idt}\t- value:`, v, `\n${idt}\t- item:`, item );
				Reflect.set( item, key, v );
			})
		}
	}
	else
	{
		throw new SyntaxError( `Encountered unexpected type: \`${type ?? item.prototype.name ?? "UNKNOWN_TYPE"}\`` );
	}
	return item;

return;


	if ( Array.isArray( item ) )
	{
		console.warn( `!Unhandled! item is array -> `, item );
		let idx;
		for( idx = 0; idx < item.length; ++idx )
		{
			const sub_item = item[ idx ];
			if ( Array.isArray( sub_item ) )
			{
				console.warn( `!Unhandled! item[${idx}] is array -> `, sub_item );
				// Need to iterate 
			}
			else if ( typeof sub_item === 'object' && Reflect.has( sub_item, "$$type" ) )
			{
				console.log( `item[${idx}] is hydratable -> `, sub_item );
				if ( Reflect.has( sub_item, "$$ref" ) )
				{
					console.log( `sub item is an external reference =>`, sub_item.$$ref );
	
					let ext_item;
					if ( !seen.has( sub_item.$$ref ) )
					{
						ext_item = await dataProvider.get( sub_item.$$ref );
						if ( ext_item === undefined ) throw new Error( `Missing referenced sub object. UUID: ${sub_item.$$ref}` );
						seen.set( sub_item.$$ref, ext_item );
					}
	
					item[ idx ] = null;
					_int_hydrateRecursive( ext_item, dataProvider, seen ).then( v => {
						item[idx] = v;
					});
				}
				else
				{
					console.log( `Custom type with value`, sub_item.$$val )
					// No need to look it up in the data provider, go right to hydrate recursive
					item[ idx ] = null;
					_int_hydrateRecursive( sub_item, dataProvider, seen ).then( v => {
						item[idx] = v;
					})
				}
			}
			else
			{
				console.log( `item[${idx}] is not hydratable ->`, sub_item );
			}
		}
	}
	else if ( typeof item === 'object' && Reflect.has( item, "$$type" ) )
	{
		for( const key of Reflect.ownKeys( item ) )
		{
			const sub_item = Reflect.get( item, key );
			if ( Array.isArray( sub_item ) )
			{
				console.warn( `!Unhandled! raw[${key.toString()}] is array -> `, sub_item );
				// Need to iterate 
			}
			else if ( typeof sub_item === 'object' && Reflect.has( sub_item, "$$type" ) )
			{
				console.log( `raw[${key.toString()}] is hydratable -> `, sub_item );
				if ( Reflect.has( sub_item, "$$ref" ) )
				{
					console.log( `sub item is an external reference =>`, sub_item.$$ref );
	
					let ext_item;
					if ( !seen.has( sub_item.$$ref ) )
					{
						ext_item = await dataProvider.get( sub_item.$$ref );
						if ( ext_item === undefined ) throw new Error( `Missing referenced sub object. UUID: ${sub_item.$$ref}` );
						seen.set( sub_item.$$ref, ext_item );
					}
	
					item[ key ] = null;
					_int_hydrateRecursive( ext_item, dataProvider, seen ).then( v => {
						item[key] = v;
					});
				}
				else
				{
					console.log( `Custom type with value`, sub_item.$$val )
					// No need to look it up in the data provider, go right to hydrate recursive
					item[ key ] = null;
					_int_hydrateRecursive( sub_item, dataProvider, seen ).then( v => {
						item[key] = v;
					})
				}
			}
			else
			{
				console.log( `raw[${key.toString()}] is not hydratable ->`, sub_item );
			}
		}
	}

	return item;
}
Serializable.Hydrate = async function<T extends object>( serialized: { $$ref: string, $$type: string }, dataProvider: DataProvider ): Promise<T>
{
	console.log( `Serializable.Hydrate:`, serialized );
	//const dehydrated = await dataProvider.get( serialized.$$ref );
	const out = await _int_hydrateRecursive( serialized, dataProvider, new Map() );
	return out;
}

// // DO NOT CHANGE THIS YOU IDIOT
// // Every time you touch the serialization code you spend a month re-writing it. Find another way to solve the issue and leave this as it stands!
// // For example, want to make some properties ignored? TOO BAD, DO IT IN THE `toJSON`!
// //              want to change something about the object asynchronously? DO IT IN THE DEHYDRATOR DECORATOR PARAMETER
// Serializable.Dehydrate = async function<T extends Class, I extends InstanceType<T> = InstanceType<T>>( target: I, dataProvider: DataProvider ): Promise< SerializeTyped< JsonType<I> > >
// {
// 	const pending = new Map();
// 	const context = new Map();

// 	const dehydrated = await _int_dehydrateRecursive( target, context, pending );

// 	await Promise.all( Array.from( pending.values() ) );

// 	for( const item of await Promise.all( Array.from( pending.values() ) ) )
// 	{
// 		dataProvider.put( item.$$uuid, item );
// 	}

// 	const jsonified = JSON.parse( JSON.stringify( dehydrated ) );
// 	dataProvider.put( dehydrated.$$uuid, jsonified );

// 	return jsonified;
// }
// async function _int_dehydrateRecursive<T extends Class, I extends InstanceType<T> = InstanceType<T>>( target: Immutable<I>, context?: Map<UuidType, any >, pending?: Map<UuidType, Promise<any>> ): Promise< SerializeTyped< JsonType<I> > >
// {
// 	// Get metadata for the callee
// 	const meta = _int_getMetadataFor( target );
// 	if ( meta === undefined ) return target as SerializeTyped<JsonType<I>>; // Can't serialize types without metadata, return as is

// 	const uuid = meta.uuidProvider ? meta.uuidProvider.call( target, target ) : _int_defaultUuidProvider.call( target, target );
	
// 	let item = context.get( uuid ) as JsonType<I>;
// 	if ( item === undefined )
// 	{
// 		item = await _int_makeOperable( target, meta );
// 		context.set( uuid, item );
// 		const own_keys = Reflect.ownKeys( item );
// 		for( const key of own_keys )
// 		{
// 			const sub_item: any = Reflect.get( item, key );
// 			if ( typeof sub_item !== 'object' || !Reflect.has( sub_item, Serializable.CLASS ) ) continue; // Can only process objects which are serializable
			
// 			const meta = _int_getMetadataFor ( sub_item       );
// 			const uuid = _int_getUuidFor     ( sub_item, meta );

// 			// Replace the value in the item with a reference that will point to the sub value after it's added to the data provider
// 			item[key] = { $$ref: uuid, $$type: meta.name };

// 			// Await the results of dehydrating this sub reference.
// 			let promise = pending.get( uuid );
// 			if ( promise === undefined )
// 			{
// 				promise = Promise.resolve().then( () => _int_dehydrateRecursive( sub_item, context, pending ) );
// 				pending.set( uuid, promise );
// 			}
// 		}
// 	}

// 	return item;
// }

// // TODO: No custom hydrators/constructors are implemented yet.
// Serializable.Hydrate = async function<T extends Class>( target: SerializeTyped< JsonType< InstanceType<T> > >, dataProvider: DataProvider ): Promise< InstanceType<T> >
// {
// 	const pending = new Map();
// 	const context = new Map();

// 	const hydrated = await _int_hydrateRecursive( target, dataProvider, context, pending );
// 	await Promise.all( Array.from( pending.values() ) );

// 	return hydrated;
// }
// async function _int_hydrateRecursive<T extends Class>( target: SerializeTyped< JsonType< InstanceType<T> > >, dataProvider: DataProvider, context?: Map<UuidType, any >, pending?: Map<UuidType, Promise<any>> ): Promise< InstanceType<T> >
// {
// 	// First, construct an instance we will hydrate
// 	const type = Serializable.REVERSE_LUT.get( target.$$type );
// 	let instance;
// 	try {
// 		instance = Reflect.construct( type, [] );
// 	}
// 	catch( e )
// 	{
// 		console.warn( `Hydrator failed to create instance for ${target.$$type}. Forcing with Object.create\n`, e );
// 		instance = Object.create( type );
// 	}
// 	Object.assign( instance, target );

// 	// Second, hydrate all sub members which need to be hydrated
// 	const own_keys = Reflect.ownKeys( target );
// 	for( const key of own_keys )
// 	{
// 		const sub_item = Reflect.get( instance, key );
// 		if ( typeof sub_item !== 'object' || !("$$ref" in sub_item) ) continue;

// 		Reflect.set( instance, key, undefined ); // Remove the reference

// 		let promise = pending.get( sub_item.$$ref );
// 		if ( promise === undefined ) {
// 			promise = dataProvider.get( sub_item.$$ref ).then( ( sub_raw ) => {
// 				return _int_hydrateRecursive( sub_raw, dataProvider, context, pending )
// 			})
// 			pending.set( sub_item.$$ref, promise )
// 		}
// 		promise.then( ( hydrated ) => {
// 			Reflect.set( instance, key, hydrated );
// 		})
// 	}
// 	delete instance.$$uuid;
// 	delete instance.$$type;
// 	return instance;
// }

// Serializable.HydrateFromUuid = async function<T extends Class>( uuid: string, dataProvider: DataProvider ): Promise<InstanceType<T>>
// {
// 	return Serializable.Hydrate( await dataProvider.get( uuid ), dataProvider );
// }