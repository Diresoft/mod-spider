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
function _int_getMetadataFor<T extends Class>( target: InstanceType<T> ): SerializableInfo<T>
{
	const out = {
		class:           Reflect.get( target, Serializable.CLASS         ),
		name:            Reflect.get( target, Serializable.TYPENAME      ),
		typeConstructor: Reflect.get( target, Serializable.CONSTRUCTOR   ),
		uuidProvider:    Reflect.get( target, Serializable.UUID_PROVIDER ),
		dehydrator:      Reflect.get( target, Serializable.DEHYDRATOR    ),
		hydrator:        Reflect.get( target, Serializable.HYDRATOR      ),
	}
	console.log( `Got metadata for: `, target, out );
	return out;
}

// == Decorator ==
export function Serializable<T extends Class>( options?: Partial< SerializableInfo<T> > )// { hydrator?: TypeHydrator< InstanceType<T> >, dehydrator?: TypeDehydrator< InstanceType<T> > })
{
	return function( target: T, _: unknown )
	{
		Reflect.set( target.prototype, Serializable.CLASS        , target                );
		Reflect.set( target.prototype, Serializable.TYPENAME     , target.name           );
		
		// Only set these on the prototype if they're defined for this object.
		if ( options?.typeConstructor !== undefined ) Reflect.set( target.prototype, Serializable.CONSTRUCTOR  , options.typeConstructor  );
		if ( options?.uuidProvider    !== undefined ) Reflect.set( target.prototype, Serializable.UUID_PROVIDER, options.uuidProvider     );
		if ( options?.dehydrator      !== undefined ) Reflect.set( target.prototype, Serializable.DEHYDRATOR   , options.dehydrator       );
		if ( options?.hydrator        !== undefined ) Reflect.set( target.prototype, Serializable.HYDRATOR     , options.hydrator         );

		// I'm ignoring toJSON for now.

		Serializable.REVERSE_LUT.set( target.name, target );
		if ( !target.prototype[ Serializable.UUID_PROVIDER ] || options?.uuidProvider === undefined )
		{
			console.warn( `\`${target.name}\` has no UUID provider. Items of this type will not be stored externally`, target.prototype, target.prototype[ Serializable.UUID_PROVIDER ] );
		}
		console.log( `@Serializable -> ${target.name}`, target.prototype );
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

Serializable.Dehydrate = async function<T extends object>( instance: T, dataProvider: DataProvider ): Promise<SerializeTyped<T>>
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
	// Retrieve the raw item if working with a reference object
	if ( Reflect.has( raw_item, "$$ref" ) )
	{
		const ref = raw_item.$$ref;
		if( seen.has( ref ) )
		{
			raw_item = seen.get( ref );
		}
		else
		{
			raw_item = await dataProvider.get( ref );
			if ( raw_item === null ) return raw_item;
			seen.set( ref, raw_item );
		}
	}

	// Next, hydrate any sub references made in these objects
	// The raw item should be either a primitive, object, or an array. So we can handle those edge cases easily
	const { $$type: type, $$val: value, $$ref: ref } = raw_item;
	const sub_item_promises = [];
	if ( typeof value !== 'object' && !Array.isArray( value ) )
	{
		// Do Nothing - Type will not be transformed
	}
	else if ( Array.isArray( value ) )
	{
		// Iterate Array to find sub-hydratable types
		for( const [idx, sub_item] of value.entries() )
		{
			if ( sub_item === null || typeof sub_item !== 'object' || !Reflect.has( sub_item, "$$type") )
			{
				continue;
			}

			value[ idx ] = null; // Prevent other references to this from walking into this object
			sub_item_promises.push( _int_hydrateRecursive( sub_item, dataProvider, seen, depth + 1 ).then( (v) =>{
				value[ idx ] = v;
				return v;
			}));
		}
	}
	else
	{
		// Iterate Object Keys to find sub-hydratable types
		for( const key of Reflect.ownKeys( value ) )
		{
			const sub_item = Reflect.get( value, key );
			if ( typeof sub_item !== 'object' || !Reflect.has( sub_item, "$$type") )
			{
				continue;
			}

			sub_item_promises.push( _int_hydrateRecursive( sub_item, dataProvider, seen, depth + 1 ).then( (v) =>{
				Reflect.set( value, key, v );
				return v;
			}));
		}
	}

	await Promise.all( sub_item_promises );

	// Next, transform the type based on the hydrator
	const meta = _int_getMetadataFor( Serializable.REVERSE_LUT.get( type ).prototype );
	const out = meta.hydrator ? await meta.hydrator( raw_item.$$val ) : Object.assign( Object.create( meta.class.prototype ), raw_item.$$val );

	if ( ref !== undefined )
	{
		seen.set( ref, out );
	}

	return out;
}

Serializable.Hydrate = async function<T extends object>( serialized: { $$ref: string, $$type: string }, dataProvider: DataProvider ): Promise<T>
{
	const out = await _int_hydrateRecursive( serialized, dataProvider, new Map() );
	return out;
}
