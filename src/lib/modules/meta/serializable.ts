import type { JsonObject, _ctor_any, _private_ctor } from "../util/types";
import { Metadata, type ClassType } from "./metadata";

const SerializableMarker: unique symbol = Symbol( "@Serializable::SerializableMarker" );
type Hydrator<T, V> = (( value: V ) => T)

export type SerializablePropertyTransformer<T, InType=any, OutType=any> = {
	out:	( val: T      ) => OutType,
	in:		( val: InType ) => T
}
export type SerializablePropertyData<T, TransformerInType=any, TransformerOutType=any> = {
	Identifier:	keyof T,
	Type:		T,
	Ignored?:	true,
	Transform?:	SerializablePropertyTransformer<T, TransformerInType, TransformerOutType>
}
export type SerializableTypeData<T, HydrateFromType=any, TransformerInType=any, TransformerOutType=any> = {
	TypeName: string,
	Hydrator: null | Hydrator<T, HydrateFromType>,
	Properties: { [K in keyof T]?: SerializablePropertyData<T[K], TransformerInType, TransformerOutType>}
}

// Required to deserialize by type name string
const name_to_info_lut: Map< string, SerializableTypeData<any> > = new Map();

function GetInfoByName<T extends object, HI=any, TI=any, TO=any>( target_name: string ): SerializableTypeData<T, HI, TI, TO>
{
	const info = name_to_info_lut.get( target_name );
	if ( info === undefined )
	{
		throw new Error( `\`${target_name}\` couldn't be deserialized! Has the class' name changed since this JSON was authored? The name was not found in the current runtime reflection.` );
	}
	return info;
}

function GetInfo<T extends object, HI=any, TI=any, TO=any>( target: T ): SerializableTypeData<T, HI, TI, TO>
{
	type SerializableInfo = SerializableTypeData<T, HI, TI, TO> // Shorthand
	let info: undefined | SerializableInfo = Reflect.get( target, SerializableMarker ) as undefined | SerializableInfo;
	if ( info === undefined )
	{
		const mirror = Metadata.Get( target );
		info = {
			Hydrator: null,
			TypeName: mirror?.TypeName ?? target.constructor.name,
			Properties: {}
		}
		Reflect.set( target, SerializableMarker, info );
		name_to_info_lut.set( info.TypeName, info );
	}
	return info;
}

export function Serializable<T extends object, HydrateFromType extends JsonObject=JsonObject>( hydrator?: (( value: HydrateFromType ) => T) )
{
	return function( target: ClassType<T> | _ctor_any )
	{
		const info			= GetInfo<T, HydrateFromType>( target.prototype );
		const base_toJSON	= target.prototype.toJSON ?? function ( this: T ){ return this; };

		if ( hydrator === undefined )
		{	// User didn't _define_ a hydrator, so assume they're okay with a generic data bashing one
			info.Hydrator = ( value: HydrateFromType ): T =>
			{
				if ( typeof value === 'object' ) {
					// Try the regular constructor and override it's properties with the value.
					// If that fails, force it into existence with data bashing.
					try {
						return Object.assign( Reflect.construct( target, [ value ] ) as object, value ) as any;
					}
					catch( e )
					{
						console.warn( `Failed to hydrate a ${info.TypeName} with it's default constructor, using data bashing` );
						return Object.create( target.prototype, value as any );
					}
				}
				else return value as unknown as T;
			}
		}

		// Customize the toJSON to return a type annotated object
		target.prototype.toJSON = function( this: T )
		{
			// If the target type doesn't have a toJSON, we'll end up recursively calling this implementation
			// when the returned annotated object attempts to serialize the _value member.
			// To prevent that, ensure the instance has a `toJSON` defined. Use the stub if it didn't have it's own
			Reflect.set( this, 'toJSON', base_toJSON );
			return {
				_type:	info.TypeName,
				_value:	this
			}
		}
	}
}

Serializable.PropertyConfiguration = function<
	T extends object,
	K,
	TransformerInType=any,
	TransformerOutType=any
>( options: Partial<SerializablePropertyData<K, TransformerInType, TransformerOutType>> )
{
	return function( target: T, property_identifier: string|symbol )
	{
		const info = GetInfo<T, any, TransformerInType, TransformerOutType>( target );
		const asKey = property_identifier as keyof T;
		info.Properties[ asKey ] = Object.assign( info.Properties[ asKey ] ?? {}, options ) as SerializablePropertyData<any>;
	}
}

// SERIALIZERS

function replacer<T extends object>( this: T, key: keyof T, value: any ): any
{
	// @ts-ignore - replacer has a mutating this type which is incompatible when it's the root.
	if( this[""] !== undefined ) return value; // Accept the step into
	
	if ( !Reflect.has( this, SerializableMarker ) ) {
		return value;
	}

	const info = GetInfo( this ).Properties[ key ];
	if ( info )
	{
		if ( info.Ignored	)	return undefined;
		if ( info.Transform )	return info.Transform.out( value );
	}
	return value;
}

export function toJSON<T extends object>( inData: T, bIsPretty: boolean = false ): string
{
	return JSON.stringify( inData, replacer, bIsPretty ? '\t' : undefined );
}

function reviver<T extends object>( key: keyof T, value: any ): T
{
	if (
		   typeof value !== 'object'
		|| value === null
		|| !("_type"	in value)
		|| !("_value"	in value)
	){
		// Any of the above conditions being true means this is _not_ an annotated type
		return value;
	}
	
	const info			= GetInfoByName<T>( value._type );
	const wrapped_value = typeof value._value !== 'object' ? value._value : new Proxy( value._value, {
		// Intercept the getter so we can reverse transform, as well as ensure any ignored props remain ignored.
		get: ( t: any, p: string | symbol, r: any ) =>
		{
			const prop_info = Reflect.get( info.Properties, p ) as undefined | SerializablePropertyData<any>;
			if ( prop_info === undefined	) return Reflect.get( t, p, r );
			if ( prop_info.Ignored			) return undefined;
			if ( prop_info.Transform		) return prop_info.Transform.in( Reflect.get( t, p, r ) );
		}
	} );

	if ( info.Hydrator === null ) throw new Error( `${info.TypeName} has a null Hydrator. Please ensure the Hydrator is either undefined or a valid function` );
	return info.Hydrator( wrapped_value );
}

export function fromJSON<T extends object>( inString: string ): T
{
	return JSON.parse( inString, reviver ) as T;
}