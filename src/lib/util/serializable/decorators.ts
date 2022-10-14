import type { Constructor, NonFunctionProperties } from "../types";

// Basic JSON types
export type JsonPrimitive		= string | number | boolean | null | object | ArrayLike<JsonPrimitive>;
export type JsonObject			= Record<string, JsonPrimitive>;
export type JsonType			= JsonPrimitive | JsonObject;

// Augmented JSON types
export type DireTypedJsonObject	= { _type: string, _value: JsonType };
export type DireJsonType		= DireTypedJsonObject | JsonType;
export type Dehydrated<T> = NonFunctionProperties<T>;

// Symbols
export const _own_class = Symbol('own_class_func_symbol');

type TypeHydrator<T extends Constructor> = ( d : Dehydrated<InstanceType<T>> ) => InstanceType<T>;
type Hydrator    <T extends Constructor> = ( d : Dehydrated<InstanceType<T>> ) => InstanceType<T>;
type Reflection< T extends Constructor > = {
	  _class        : T
	, _type_hydrator: TypeHydrator<T> | null
	, _hydrator     : Hydrator    <T> | boolean
}

export class NonReflectedTypeError<T extends Constructor> extends TypeError
{
	public readonly incident_type : T;
	constructor( incident_type : T )
	{
		super( `Type \`${incident_type.name}\` has no reflection` );
		this.incident_type = incident_type;
	}
}

const _mirror = new Map< string, Reflection< Constructor > >();
function reflect<T extends Constructor>( target_class_type : T, bAllowCreate : boolean = true )
{
	const name = target_class_type.name;
	if ( !bAllowCreate && !_mirror.has( name ) ) throw new NonReflectedTypeError( target_class_type )
	let out : Reflection<Constructor> = {
		  _class:			target_class_type
		, _type_hydrator:	null
		, _hydrator:		true
	}
	if ( !_mirror.has( name ) ) _mirror.set( name, out );
	else out = _mirror.get( name ) ?? out;
	return out;
}

export function Serializable<T extends Constructor>( target_class_type : T )
{
	// Ensure a record for this type exists in the mirror
	reflect( target_class_type );

	return class extends target_class_type {
		get [_own_class]() { return target_class_type };
		toJSON() {
			const serialized_this = super.toJSON ? super.toJSON() : Object.assign( {}, this );
			return {
				  _type: target_class_type.name
				, _value: serialized_this
			}
		}
	}
}
export function TypeHydrator<T extends Constructor>( target_class_type : T, key : string, descriptor : TypedPropertyDescriptor<TypeHydrator<T>> ) // eslint-disable-line @typescript-eslint/no-unused-vars
{
	const reflection = reflect( target_class_type );
	reflection._type_hydrator = descriptor.value ?? null; // Explicitly use null if the provided value is falsy
}
export function NoAutoHydrator<T extends Constructor>( target_class_type : T )
{
	const reflection = reflect( target_class_type );
	reflection._hydrator = reflection._hydrator ?? false; // Indicate that the hydrator shouldn't run unless one is set explicitly
}
export function Hydrator<T extends Constructor>( target_class_type : InstanceType<T>, key : string, descriptor : TypedPropertyDescriptor<Hydrator<T>> ) // eslint-disable-line @typescript-eslint/no-unused-vars
{
	const reflection = reflect( target_class_type.constructor );
	reflection._hydrator = descriptor.value ?? true; // Enables default if it's value is falsy
}
export function JsonHydrator( key : string, value : JsonType )
{
	if ( // Unsupported primitives pass through untransformed
			value				=== null		// Null is an 'object' type still, so check against that
		||	typeof value		!== "object"	// objects are the only primitive we work with
		||	!("_type" in value)				// we need the _type to exist
		||	!("_value" in value)				// we need the _value to exist
	) { return value; }
	const typed_target = value as DireTypedJsonObject; // Cast to the desired type now that it's ensured

	const reflection = _mirror.get( typed_target._type );
	if ( !reflection ) throw new TypeError(`Invalid type \`${typed_target._type}\` encountered while parsing JSON` );

	// Hydrate the type and object
	const instance = reflection._type_hydrator ? reflection._type_hydrator( typed_target._value as never ) : new reflection._class();
	if ( reflection._hydrator )
	{
		if ( typeof reflection._hydrator === 'function' )
		{
			reflection._hydrator.call( instance, typed_target._value as never );
		}
		else
		{
			Object.assign( instance, value._value );
		}
	}

	return instance;
}

type serializable_primitive = {
	toJSON: () => JsonType
}
export function make_primitive_serializable<T>(
	  target_class_type : T
	, toJSON			: null | (( this : T ) => JsonType)	= null
	, type_hydrator		: null | (( d : JsonType ) => T)	= null
) {
	const primitive 	= target_class_type as serializable_primitive;
	const reflection	= reflect( primitive.constructor as Constructor );
	const dehydrator	= primitive.toJSON ?? toJSON;
	primitive.toJSON	= function( this : serializable_primitive ) {
		return {
			_type: reflection._class.name,
			_value: dehydrator.call( this )
		}
	}
	reflection._type_hydrator = type_hydrator;
}