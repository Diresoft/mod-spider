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

export type SerializeTyped<T=any> = { $$type: string, $$value?: Immutable<T> };

export type UuidType                       = string;
export type UuidProvider <T extends Class> = ( instance: Immutable< InstanceType<T> > ) => UuidType;

export type Dehydrator < T, DT = any > = ( hydrated  : Immutable<T>  ) => Promise< DT >;
export type Hydrator   < T, DT = any > = ( dehydrated: DT            ) => Promise< T  >;

export interface DataProvider {
	has   ( uuid: string                                      ): Promise<boolean>;
	put   ( uuid: string, data: SerializeTyped< JsonType >    ): Promise<void>;
	get<T>( uuid: string                                      ): Promise< SerializeTyped< JsonType<T> > >;
	delete( uuid: string                                      ): Promise<void>;
}
export class localStorageDataProvider implements DataProvider {
	public async has(uuid: string): Promise<boolean> {
		return localStorage.getItem( uuid ) !== null;
	}
	public async put(uuid: string, data: SerializeTyped<any>): Promise<void> {
		return localStorage.setItem( uuid, JSON.stringify( data ) );
	}
	public async get<T>(uuid: string): Promise<SerializeTyped<JsonType<T>>> {
		const raw = localStorage.getItem( uuid );
		if( raw === null ) throw new Error( `Item not found in localStorage: \`${uuid}\`` );
		else
		{
			return JSON.parse( raw );
		}
	}
	public async delete( uuid: string): Promise<void>
	{
		return localStorage.removeItem( uuid );
	}
}
export const defaultDataProvider = new localStorageDataProvider();


export type SerializableInfo<T extends Class, DT = any > = {
	class:       Class<T>
	name:        string

	uuidProvider     ?: UuidProvider<T>
	dehydrator       ?: Dehydrator<InstanceType<T>, DT>
	hydrator         ?: Hydrator  <InstanceType<T>, DT|JsonType<DT>>
	// dataProvider     : DataProvider
}

// == Serialization Types ==


// == Internal utility and fallback functions ==
function _int_getMetadataFor<T extends Class>( target: InstanceType<T> ): SerializableInfo<T>
{
	const out = {
		class:           Reflect.get( target, Serializable.CLASS         ),
		name:            Reflect.get( target, Serializable.TYPENAME      ),
		uuidProvider:    Reflect.get( target, Serializable.UUID_PROVIDER ),
		dehydrator:      Reflect.get( target, Serializable.DEHYDRATOR    ),
		hydrator:        Reflect.get( target, Serializable.HYDRATOR      ),
		// dataProvider:    Reflect.get( target, Serializable.DATA_PROVIDER ) ?? defaultDataProvider
	}
	return out;
}

// == Decorator ==
export function Serializable<T extends Class>( options?: Partial< SerializableInfo<T> > )// { hydrator?: TypeHydrator< InstanceType<T> >, dehydrator?: TypeDehydrator< InstanceType<T> > })
{
	return function( target: T, _: unknown )
	{
		Reflect.set( target.prototype, Serializable.CLASS        , target                );
		Reflect.set( target.prototype, Serializable.TYPENAME     , target.name           );
		
		// Only set these on the prototype if they're defined for this object. Even if they're set as undefined later lookups won't walk the prototype tree like we need them to.
		if ( options?.uuidProvider    !== undefined ) Reflect.set( target.prototype, Serializable.UUID_PROVIDER, options.uuidProvider     );
		if ( options?.dehydrator      !== undefined ) Reflect.set( target.prototype, Serializable.DEHYDRATOR   , options.dehydrator       );
		if ( options?.hydrator        !== undefined ) Reflect.set( target.prototype, Serializable.HYDRATOR     , options.hydrator         );
		// if ( options?.dataProvider    !== undefined ) Reflect.set( target.prototype, Serializable.DATA_PROVIDER, options.dataProvider     );

		// I'm ignoring toJSON for now.

		Serializable.REVERSE_LUT.set( target.name, target );
		// if ( !target.prototype[ Serializable.UUID_PROVIDER ] || options?.uuidProvider === undefined )
		// {
		// 	console.warn( `\`${target.name}\` has no UUID provider. Items of this type will not be stored externally`, target.prototype, target.prototype[ Serializable.UUID_PROVIDER ] );
		// }
		
		//console.log( `@Serializable -> ${target.name}`, target.prototype );
	}
}

// == Decorator Members ==

// By using different properties for each piece of metadata, the prototype chain lookup will function as expected.
// i.e. you can change one of these in a subclass without having to handle the whole metadata object as a change
Serializable.CLASS         = Symbol( "@@Serializable::CLASS"         );
Serializable.TYPENAME      = Symbol( "@@Serializable::TYPENAME"      );
Serializable.HYDRATOR      = Symbol( "@@Serializable::HYDRATOR"      );
Serializable.DEHYDRATOR    = Symbol( "@@Serializable::DEHYDRATOR"    );
Serializable.UUID_PROVIDER = Symbol( "@@Serializable::UUID_PROVIDER" );
// Serializable.DATA_PROVIDER = Symbol( "@@Serializable::DATA_PROVIDER" );

// Provide a static reverse LUT for hydrating from the type name
Serializable.REVERSE_LUT = new Map<string, Class>();

// == Serializer Helpers ==
Serializable.GetDataProviderFor = function ( target: object ): DataProvider
{
	return defaultDataProvider; //Reflect.get( target, Serializable.DATA_PROVIDER ) ?? defaultDataProvider;
}

Serializable.GetUuidOf = function ( target: object ): UuidType
{
	const meta = _int_getMetadataFor( target );
	if ( meta === undefined || meta.uuidProvider === undefined ) throw new Error( `Type \`${target.constructor.name}\` does not have a UUID provider defined` );
	return meta.uuidProvider( target );
}

// == CORE TYPE SERIALIZER DATA ==

// # Set
// Serializes to an array of it's contents. Deserializes back into a Set from the array content.
Serializable({
	async dehydrator( hydrated: Immutable<Set<unknown>> ) {
		return Array.from( hydrated.values() )
	},
	async hydrator( dehydrated: unknown[] ): Promise< Set<unknown> >
	{
		return new Set( dehydrated );
	}
})(Set, null);

// # Map
// Serializes to an array of entries. Deserializes back into a Map from the array content.
Serializable({
	async dehydrator( hydrated: Immutable<Map<unknown, unknown>> ) {
		return Array.from( hydrated.entries() );
	},
	async hydrator( dehydrated: [keyof any, unknown][] ) {
		return new Map( dehydrated );
	}
})(Map, null);

// === DEHYDRATE ===
async function _int_dehydrateRecursive( item: any, external: Map<string, any>, seen: Map<any, Promise<any>> = new Map(), depth: number = 0 ): Promise<any>
{
	const original = item;
	const meta = _int_getMetadataFor( item );
	// console.log( `_int_dehydrateRecursive ::D${depth};1 -> Dehydrating\n`, item, meta )

	// If we have a dehydrator, run it now so we're working on the simplest types
	if( meta.dehydrator !== undefined )
	{
		item = await meta.dehydrator( item );
		// console.log( `_int_dehydrateRecursive:processValue ::D${depth};2 -> Dehydrated incoming item\n`, item, original );
	}

	const sub_item_promises: Promise<any>[] = [];
	const processValue = async ( value: any, inner_depth: number = 0 ) =>
	{
		let out: any;
		if ( Array.isArray( value ) )
		{
			out = [];
			// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};3 -> Value is array\n`, value, item )
			for( let idx = 0; idx < value.length; ++idx )
			{
				const sub_item = value[idx];
				out[ idx ] = sub_item;

				if ( !Array.isArray( sub_item ) && typeof sub_item !== 'object' )
				{ // Not an array or object, therefore we don't need to iterate nor dehydrate, leave as is
					// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};3.a -> sub_item will NOT be processed\n`, sub_item, idx, value )
					continue;
				}

				const sub_meta = _int_getMetadataFor( sub_item );
				if ( sub_meta.class === undefined )
				{ // No metadata for this type, but it is iterable
					// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};3.b -> sub_item is iterable, but not a serialize type\n`, sub_item, idx, value )
					out[ idx ] = await processValue( sub_item, inner_depth + 1 );
					continue;
				}

				// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};3.c -> sub_item will be processed\n`, sub_item, idx, value );
				let pending: Promise<any>;
				if ( seen.has( sub_item ) ) pending = seen.get( sub_item ) as Promise<any>;
				else                        pending = _int_dehydrateRecursive( sub_item, external, seen, depth + 1 )

				seen.set( sub_item, pending.then( v => {
					// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};3.c.i -> sub_item finished processing\n`, v, sub_item, idx, value )
					if ( sub_meta.uuidProvider !== undefined )
					{
						// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};3.c.ii -> sub_item can be stored externally\n`, v, sub_item, idx, value )
						const ref = sub_meta.uuidProvider( sub_item );
						out[ idx ] = { $$ref: ref, $$type: sub_meta.name };
						external.set( ref, { $$type: sub_meta.name, $$value: v.$$value } );
					}
					else
					{
						// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};3.c.iii -> sub_item can't be stored externally\n`, v, sub_item, idx, value )
						out[ idx ] = v;
					}
					return v;
				}));
				sub_item_promises.push( pending );
			}
		}
		else if ( value !== null && typeof value === 'object' )
		{
			out = {};
			// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};4 -> Value is an object\n`, value, item )
			for( const key of Reflect.ownKeys( value ) )
			{
				const sub_item = Reflect.get( value, key );
				Reflect.set( out, key, sub_item );

				if ( sub_item === null || (!Array.isArray( sub_item ) && typeof sub_item !== 'object') )
				{ // Not an array or object, therefore we don't need to iterate nor dehydrate, leave as is
					// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};4.a -> sub_item will NOT be processed\n`, sub_item, key, value )
					out[ key ] = await processValue( sub_item, inner_depth + 1 );
					continue;
				}

				const sub_meta = _int_getMetadataFor( sub_item );
				if ( sub_meta.class === undefined )
				{ // No metadata for this type, but it is iterable
					// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};4.b -> sub_item is iterable, but not a serialize type\n`, sub_item, key, value )
					processValue( sub_item, inner_depth + 1 );
					continue;
				}

				// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};4.c -> sub_item will be processed\n`, sub_item, key, value );
				let pending: Promise<any>;
				if ( seen.has( sub_item ) ) pending = seen.get( sub_item ) as Promise<any>;
				else                        pending = _int_dehydrateRecursive( sub_item, external, seen, depth + 1 )

				seen.set( sub_item, pending.then( v => {
					// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};4.b.i -> sub_item finished processing\n`, v, sub_item, key, value )
					if ( sub_meta.uuidProvider !== undefined )
					{
						// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};4.b.ii -> sub_item can be stored externally\n`, v, sub_item, key, value )
						const ref = sub_meta.uuidProvider( sub_item );
						out[ key ] = { $$ref: ref, $$type: sub_meta.name };
						external.set( ref, { $$type: sub_meta.name, $$value: v.$$value } );
					}
					else
					{
						// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};4.b.iii -> sub_item can't be stored externally\n`, v, sub_item, key, value )
						out[ key ] = v;
					}
					return v;
				}));
				sub_item_promises.push( pending );
			}
		}
		else
		{
			// console.log( `_int_dehydrateRecursive:processValue ::D${depth};iD${inner_depth};4 -> Value is not an array or object\n`, value, item )
			out = value;
		}
		return out;
	}
	const clone = await processValue( item );
	// console.log( `_int_dehydrateRecursive ::D${depth};5 -> Awaiting sub item promises\n`, sub_item_promises )
	await Promise.all( sub_item_promises );

	let out;
	if( meta.uuidProvider ) out =  { $$ref: meta.uuidProvider( original ), $$value: clone, $$type: meta.name }
	else                    out =  {                                       $$value: clone, $$type: meta.name };

	// console.log( `_int_dehydrateRecursive ::D${depth};6 -> Finished returning output\n`, out, original )
	return out;
}
Serializable.Dehydrate = async function( instance: any ): Promise<any>
{
	const external = new Map<string, { $$type: string, $$value: any }>();
	const out = await _int_dehydrateRecursive( instance, external );

	// Put all external references in their data providers
	for( const [ ref, item ] of external )
	{
		defaultDataProvider.put( ref, {
			$$type:  item.$$type,
			$$value: item.$$value
		})
	}

	// console.log( `Serializable.Dehydrate ::out`, out );

	return out;
}

async function _int_hydrateRecursive( item: any, seen: Map<string, any>, depth: number = 0 )
{

	if ( "$$ref" in item )
	{ // Item is a reference, inflate with data provider attached to type, or seen lut
		const ref = item.$$ref;
		item = seen.get( ref );
		if ( item === undefined )
		{
			item = await defaultDataProvider.get( ref );
			if ( item === undefined || item === null ) throw new Error( `\`${ref}\` was not found, or was null/undefined after retrieval` );
			seen.set( ref, item );
		}
		else
		{
			// console.log( `ALREADY PROCESSING ITEM WITH REF:`, ref );
			return item.$$value;
		}
	}
	const type_name = item.$$type;
	const type = Serializable.REVERSE_LUT.get( type_name );
	if( type === undefined ) {
		throw new Error( `Invalid or unknown type during hydration. \`${item.$$type}\` not found in reverse lookup. Has the type name changed since dehydration?` );
	}

	const meta = _int_getMetadataFor( type.prototype );
	// console.log( `_int_hydrateRecursive ::D${depth};1 -> Hydrating from item: `, item, `\nmetadata:`, meta );
	const value = item.$$value;
	// console.log( `_int_hydrateRecursive ::D${depth};2 -> Begin dehydrating raw item: `, item, `\n`, value );

	const sub_item_promises: Promise<any>[] = [];

	async function processValue( value: any[] | any, inner_depth: number = 0 )
	{
		if ( Array.isArray( value ) )
		{
			for( let idx = 0; idx < value.length; ++idx )
			{
				const sub_item = value[ idx ];
				value[ idx ] = null;

				if ( !Array.isArray( sub_item ) && typeof sub_item !== 'object' )
				{
					value[ idx ] = sub_item;
				}
				else if ( Array.isArray( sub_item ) || ( typeof sub_item === 'object' && !Reflect.has( sub_item, "$$type" ) ) )
				{ // Value is iterable, but not a serialized type.
					value[ idx ] = await processValue( sub_item, inner_depth + 1 );
				}
				else
				{
					sub_item_promises.push(
						_int_hydrateRecursive( sub_item, seen, depth + 1 ).then( v => {
							// console.log( `Finished hydrate:`, v );
							value[ idx ] = v;
						})
					)
				}
			}
		}
		else if ( typeof value === 'object' )
		{
			for( const key of Reflect.ownKeys( value ) )
			{
				const sub_item = value[ key ];
				value[ key ] = null;

				if ( !Array.isArray( sub_item ) && typeof sub_item !== 'object' )
				{
					value[ key ] = sub_item;
				}
				else if ( Array.isArray( sub_item ) || ( typeof sub_item === 'object' && !Reflect.has( sub_item, "$$type" ) ) )
				{ // Value is iterable, but not a serialized type.
					value[ key ] = await processValue( sub_item, inner_depth + 1 );
				}
				else
				{
					sub_item_promises.push(
						_int_hydrateRecursive( sub_item, seen, depth + 1 ).then( v => {
							// console.log( `Finished hydrate:`, v );
							value[ key ] = v;
						})
					)
				}
			}
		}
		// ELSE: Value was primitive, no work to be done
		return value;
	}
	await processValue( value );
	await Promise.all( sub_item_promises );
	// console.log( `_int_hydrateRecursive ::D${depth};4 -> Finished processing all sub items` );

	let out = value;
	if( meta.hydrator ) out = await meta.hydrator( value );
	if ( !( out instanceof type ) )
	{
		out = Object.assign( Object.create( type.prototype ), out );
	}
	// console.log( `_int_hydrateRecursive ::D${depth};4 -> Finished hydrating`, out, clone, value, item );
	return out;
}

Serializable.Hydrate = async function<T>( uuid: string ): Promise<T>
{
	const out = await _int_hydrateRecursive( { $$ref: uuid }, new Map() );
	// console.log( `Serializable.Hydrate ::out`, out );
	return out;
}
