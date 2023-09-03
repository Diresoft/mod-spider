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

export type SerializeTyped<T=any> = Immutable<T> & { $$uuid: string, $$type: string };

export type UuidType                       = string;
export type UuidProvider <T extends Class> = ( instance: Immutable< InstanceType<T> > ) => UuidType;

export type TypeConstructor < T extends Class >                 = ( dehydrated : SerializeTyped<JsonType> ) => InstanceType< T >;

export type Dehydrator      < T extends Class,
                              I extends InstanceType< T > = InstanceType< T > > = ( instance: I ) => Promise< Immutable< I > >;
export type Hydrator        < T extends Class,
                              I extends InstanceType< T > = InstanceType< T > > = ( instance: I ) => Promise< I >;

export type SerializableInfo<T extends Class> = {
	class:       Class<T>
	name:        string

	typeConstructor  ?: TypeConstructor< InstanceType<T> >
	uuidProvider ?: UuidProvider<T>
	dehydrator   ?: Dehydrator<T>
	hydrator     ?: Hydrator<T>
}

// == Serialization Types ==

export interface DataProvider {
	has   ( uuid: string                                      ): Promise<boolean>;
	put   ( uuid: string, data: SerializeTyped< JsonType >    ): Promise<void>;
	get<T>( uuid: string                                      ): Promise< SerializeTyped< JsonType<T> > >;
}


// == Internal utility and fallback functions ==

function _int_defaultConstructor<T extends Class>( dehydrated: SerializeTyped<JsonType> ): InstanceType< T >
{
	const type = Serializable.REVERSE_LUT.get( dehydrated.$$type );
	if ( type === undefined ) throw new Error( `Unknown type \`${dehydrated.$$type}\` encountered while running Serializable's default constructor` );

	// Create an instance of that type, with all properties of the dehydrated object assigned to it
	const instance = Object.assign( Reflect.construct( type, [] ), dehydrated );

	// Delete the Serialization typings from the instance
	delete instance.$$uuid;
	delete instance.$$type;

	// Return the newly created replica of the original instance
	return instance;
}

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
async function _int_makeOperable<T extends Class>( target: Immutable<InstanceType<T>>, meta: SerializableInfo<T> ): Promise< JsonType< InstanceType<T> > >
{
	const type = meta.name;
	const uuid = _int_getUuidFor( target, meta );

	const out = Object.assign( { $$uuid: uuid, $$type: type }, meta.dehydrator ? await meta.dehydrator.call( target, target ) : target );
	return out;
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


// == Primitive Type Custom Serializers ==
// TODO: I need to handle some types specially. Effectively I need to give them a toJSON/fromJSON conversion in place.
// The reason for this is that these types might not have a stable uuid
// i.e. a Set won't _have_ a UUID, but if gets serialized outside of the object it needs one. That means I need to generate a UUID for it.
// That alone won't be an issue. However, the problem is that this UUID will be different each time.
// I serialize to a UUID, deserialize, then reserialize again and the UUID will change. This means the old UUID will persist forever in localStorage.
// It may eventually expire and delete itself, but I also don't _need_ to serialize this to a separate object. What would be more important is that
// the objects _in_ the set become external references. A set would just turn into an array of values, which should then be serialized into new items
// in the dataProvider (unless it's not a serializable type)
//
// The alternative would be to _serialize_ the Set as a separate object, but somehow handle the UUID issue. Either by deleting the old Key immediately
// upon deserialization (would need some way to differentiate permanent UUIDs vs transient UUIDs). Or, I actually add the UUID to the Set's
// members so the next time it serializes it uses the same key.
// This might actually be preferable, as it circumvents the circular array reference issue.
// 
// So I need a way to mark transient keys that attach themselves to deserialized objects.








// DO NOT CHANGE THIS YOU IDIOT
// Every time you touch the serialization code you spend a month re-writing it. Find another way to solve the issue and leave this as it stands!
// For example, want to make some properties ignored? TOO BAD, DO IT IN THE `toJSON`!
//              want to change something about the object asynchronously? DO IT IN THE DEHYDRATOR DECORATOR PARAMETER
Serializable.Dehydrate = async function<T extends Class, I extends InstanceType<T> = InstanceType<T>>( target: I, dataProvider: DataProvider ): Promise< SerializeTyped< JsonType<I> > >
{
	const pending = new Map();
	const context = new Map();

	const dehydrated = await _int_dehydrateRecursive( target, context, pending );

	await Promise.all( Array.from( pending.values() ) );

	for( const item of await Promise.all( Array.from( pending.values() ) ) )
	{
		dataProvider.put( item.$$uuid, item );
	}

	const jsonified = JSON.parse( JSON.stringify( dehydrated ) );
	dataProvider.put( dehydrated.$$uuid, jsonified );

	return jsonified;
}
async function _int_dehydrateRecursive<T extends Class, I extends InstanceType<T> = InstanceType<T>>( target: Immutable<I>, context?: Map<UuidType, any >, pending?: Map<UuidType, Promise<any>> ): Promise< SerializeTyped< JsonType<I> > >
{
	// Get metadata for the callee
	const meta = _int_getMetadataFor( target );
	const uuid = meta.uuidProvider ? meta.uuidProvider.call( target, target ) : _int_defaultUuidProvider.call( target, target );
	
	let item = context.get( uuid ) as JsonType<I>;
	if ( item === undefined )
	{
		item = await _int_makeOperable( target, meta );
		await context.set( uuid, item );
		const own_keys = Reflect.ownKeys( item );
		for( const key of own_keys )
		{
			const sub_item: any = Reflect.get( item, key );
			if ( typeof sub_item !== 'object' || !Reflect.has( sub_item, Serializable.CLASS ) ) continue; // Can only process objects which are serializable
			
			const meta = _int_getMetadataFor ( sub_item       );
			const uuid = _int_getUuidFor     ( sub_item, meta );

			// Replace the value in the item with a reference that will point to the sub value after it's added to the data provider
			item[key] = { $$ref: uuid, $$type: meta.name };

			// Await the results of dehydrating this sub reference.
			let promise = pending.get( uuid );
			if ( promise === undefined )
			{
				promise = Promise.resolve().then( () => _int_dehydrateRecursive( sub_item, context, pending ) );
				pending.set( uuid, promise );
			}
		}
	}

	return item;
}

// TODO: No custom hydrators/constructors are implemented yet.
Serializable.Hydrate = async function<T extends Class>( target: SerializeTyped< JsonType< InstanceType<T> > >, dataProvider: DataProvider ): Promise< InstanceType<T> >
{
	const pending = new Map();
	const context = new Map();

	const hydrated = await _int_hydrateRecursive( target, dataProvider, context, pending );
	await Promise.all( Array.from( pending.values() ) );

	return hydrated;
}
async function _int_hydrateRecursive<T extends Class>( target: SerializeTyped< JsonType< InstanceType<T> > >, dataProvider: DataProvider, context?: Map<UuidType, any >, pending?: Map<UuidType, Promise<any>> ): Promise< InstanceType<T> >
{
	// First, construct an instance we will hydrate
	const type = Serializable.REVERSE_LUT.get( target.$$type );
	let instance;
	try {
		instance = Reflect.construct( type, [] );
	}
	catch( e )
	{
		console.warn( `Hydrator failed to create instance for ${target.$$type}. Forcing with Object.create\n`, e );
		instance = Object.create( type );
	}
	Object.assign( instance, target );

	// Second, hydrate all sub members which need to be hydrated
	const own_keys = Reflect.ownKeys( target );
	for( const key of own_keys )
	{
		const sub_item = Reflect.get( instance, key );
		if ( typeof sub_item !== 'object' || !("$$ref" in sub_item) ) continue;

		Reflect.set( instance, key, undefined ); // Remove the reference

		let promise = pending.get( sub_item.$$ref );
		if ( promise === undefined ) {
			promise = dataProvider.get( sub_item.$$ref ).then( ( sub_raw ) => {
				return _int_hydrateRecursive( sub_raw, dataProvider, context, pending )
			})
			pending.set( sub_item.$$ref, promise )
		}
		promise.then( ( hydrated ) => {
			Reflect.set( instance, key, hydrated );
		})
	}
	delete instance.$$uuid;
	delete instance.$$type;
	return instance;
}

Serializable.HydrateFromUuid = async function<T extends Class>( uuid: string, dataProvider: DataProvider ): Promise<InstanceType<T>>
{
	return Serializable.Hydrate( await dataProvider.get( uuid ), dataProvider );
}