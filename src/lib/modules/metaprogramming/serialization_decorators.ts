import type { Constructor, NonFunctionProperties } from "../util/types";

// Exported Symbols
export const reflection		= Symbol( "@Serializable::prop::reflection"		);
       const _typeHydrator	= Symbol( "@Serializable::func::_typeHydrator"	);
       const _hydrator		= Symbol( "@Serializable::func::_hydrator"		);
       const _dehydrator	= Symbol( "@Serializable::func::_dehydrator"	);
export const SERIALIZED_TYPE_NAME = Symbol( "@Serializable::func::SERIALIZED_TYPE_NAME" );

// Internal utility types
class private_ctor { private constructor() {} };
type _class = (Constructor | { prototype : private_ctor, name : string} );
type _safe_instance_type<T> = T extends abstract new(...args:unknown[])=>unknown ? InstanceType<T> : never;

type type_reflection< T extends _class > = {
	  ClassName: string
	, ClassType: T
	, bAllowDefaultSerializationMethods : boolean
	, NonSerializedMembers	: Array<string | symbol>
	, [_typeHydrator]		?: ( d		: Dehydrated<T>					) => T
	, [_hydrator]			?: ( this	: T,		d : Dehydrated<T>	) => void
}

// Basic JSON types
export type JsonPrimitive		= string | number | boolean | null | object | ArrayLike<JsonPrimitive>;
export type JsonObject			= Record<string, JsonPrimitive>;
export type JsonType			= JsonPrimitive | JsonObject;

// Augmented JSON types
export type DireTypedJsonObject	= { _type: string, _value: JsonType };
export type DireJsonType		= DireTypedJsonObject | JsonType;

// Exported Utility Types
export type Dehydrated< T, NP = void > = NonFunctionProperties<T> & NonFunctionProperties<NP>;
export class NonReflectedTypeError< T extends _class > extends TypeError
{
	public readonly incident_type : null | T;
	constructor( incident_type : null | T, incident_type_name : null | string = null )
	{
		if ( !incident_type )
		{
			super( `Type \`${incident_type_name}\` has no reflection` );
		}
		else
		{
			super( `Type \`${incident_type.name}\` has no reflection` );
		}
		this.incident_type = incident_type;
	}
}

function getIncidentName( incident: any ): string
{
	//console.log( `getIncidentName`, incident, incident.prototype, incident.prototype[SERIALIZED_TYPE_NAME], incident.prototype[reflection] );
	if ( typeof incident === 'string' )
	{
		return incident
	}
	return incident.name;
}

const _mirror : Map<string, type_reflection<_class>> = new Map();
export function reflect<T extends _class>( incident : T | string ) : type_reflection<T>
{
	console.log( `reflect`, incident, incident.prototype, incident.prototype[SERIALIZED_TYPE_NAME], incident.prototype[reflection] );
	if ( incident.prototype && incident.prototype[reflection] ) return incident.prototype[reflection];

	const incident_type_name = getIncidentName( incident );
	if ( !_mirror.has( incident_type_name ) )
	{
		if ( typeof incident === 'string' ) throw new NonReflectedTypeError( null, incident ); // Can't create a reflection from a string
		const out = {
			ClassName:							incident_type_name,
			ClassType:							incident,
			bAllowDefaultSerializationMethods:	true,
			NonSerializedMembers:				[]
		};
		_mirror.set( incident_type_name, out );
		return out;
	}
	else
	{
		return _mirror.get( incident_type_name ) as type_reflection<T>;
	}
}

export function Serializable<T extends _class>( base_class : T ) : T
{
	const meta = (base_class.prototype[reflection] = reflect( base_class ));

	// `toJSON` is called before the replacer function when calling JSON.stringify
	// Because toJSON will transform the object, we can't embed the typings in the JSON during the stringify stage. Instead, we have
	// to embed that in the `toJSON` function itself.
	// This is also the time to filter the keys of the object to ignore those that are marked to be ignored
	//
	// Note: The returned structure should contain the dehydrated form of the instance. i.e. it should loose it's outer type
	// 		here. If it maintains it's type inside the returned structure, it will then recursively transform itself as the
	//		process steps into the returned structure

	const original_toJSON = base_class.prototype.toJSON;
	base_class.prototype.toJSON = function( this : T ) : DireTypedJsonObject
	{
		let dehydrated = original_toJSON ? original_toJSON.call( this ) : this; // Run the provided toJSON for the initial serialization, then augment the results
		if ( typeof dehydrated === 'object' && !Array.isArray( dehydrated ) )
		{	// If we're dehydrating an object, we need to strip it's prototype and filter out any non serialized members
			dehydrated = new Proxy ( Object.assign( {}, this ), {
				ownKeys: ( t : object ) => Reflect.ownKeys( t ).filter( p => !( meta.NonSerializedMembers?.includes( p ) ) ) 
			} );
		}

		return { _type: meta.ClassName, _value: dehydrated };
	}

	if ( meta.bAllowDefaultSerializationMethods )
	{ // Inject if needed
		base_class.prototype[ _typeHydrator ]	= base_class.prototype[ _typeHydrator ] ?? function(							 ) { return Object.create( meta.ClassType	); }
		base_class.prototype[ _hydrator ]		= base_class.prototype[ _hydrator ]		?? function( this : T, d : Dehydrated<T> ) { return Object.assign( this, d			); }
	}

	return base_class;
}


// This is the only way I was able to get typescript to accept a base class with a private constructor
export function TypeHydrator<T extends typeof private_ctor  >( base_class : T, key : string, descriptor : TypedPropertyDescriptor< any                            > ) : void // eslint-disable-line @typescript-eslint/no-explicit-any
export function TypeHydrator<T extends        Constructor<T>>( base_class : T, key : string, descriptor : TypedPropertyDescriptor< ( d : Dehydrated<T, any> ) => T > ) : void
{
	const meta = (base_class.prototype[reflection] = reflect( base_class ));
	meta[ _typeHydrator ] = descriptor.value;
}

export function NoAutoHydrator<T extends _class>( base_class : T ) : void
{
	const meta = (base_class.prototype[reflection] = reflect( base_class ));
	meta.bAllowDefaultSerializationMethods = false; // Prevent the @Serializable decorator from injecting the default serialization methods
}

export function DoNotSerialize<T extends _class>( base_class : _safe_instance_type<T>, prop_key : string | symbol ) : void
{
	const meta = (base_class[reflection] = reflect<T>( base_class.constructor ));
	meta.NonSerializedMembers.push( prop_key );
}

function json_hydrator( key : string, value : unknown )
{
	if ( typeof value !== 'object' || value === null) return value; // Only non-null object types need special handling
	if ( !("_type" in value) || !("_value" in value ) ) return value; // Can't be a @Serializable object without these
	const as_typed = value as DireTypedJsonObject; // Inform TypeScript that we know it's compatible with our typed json object
	const meta = reflect( as_typed._type );
	if ( !meta ) throw new NonReflectedTypeError( null, as_typed._type ); // We can't revive this object as we have no metadata for it

	const typeHydrator	= meta[_typeHydrator];
	const hydrator		= meta[_hydrator    ];

	// Construct the instance, using the existing data if possible
	let instance = null;
	if ( typeHydrator )
	{
		instance = typeHydrator( as_typed._value as Dehydrated<unknown, unknown>);
	}
	else if ( meta.bAllowDefaultSerializationMethods )
	{
		instance = new (meta.ClassType as new(...args:unknown[])=>any)(); // eslint-disable-line @typescript-eslint/no-explicit-any
	}

	// Hydrate the instance if allowed
	if ( hydrator )
	{
		hydrator.call( instance, as_typed._value as Dehydrated<unknown, unknown> );
	}
	else if ( meta.bAllowDefaultSerializationMethods )
	{
		Object.assign( instance, as_typed._value );
	}
	
	return instance;
}

export function JsonSerialize<T>( data : T ) : string
{
	return JSON.stringify( data );
}

export function JsonDeserialize<T>( data : string ) : T
{
	return JSON.parse( data, json_hydrator ) as T;
}

// Set up some 'primitive' types as serializable
(Map.prototype as any).toJSON = function( this : Map<any, any> ) { return Array.from( this.entries() ); } // eslint-disable-line @typescript-eslint/no-explicit-any
TypeHydrator( Map, '', { value: ( d : Iterable<any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
	return new Map(d);
} });
Serializable( Map );
