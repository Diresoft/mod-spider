import { db_adapter } from "$lib/app/context";
import type { Class, InstanceOf, JsonPrimitive, JsonType } from "$lib/util/types";
import { Metadata } from "./metadata";

const SerializableMarker:		unique symbol = Symbol( "@@Serializable::SerializableMarker" );
const SerializableConstructor:	unique symbol = Symbol( "@@Serializable::Constructor" );

const SerializedTypeKeyPrefix = "$$_";

type Hydrator<T, HydrateFromType = JsonType<T>> = (( value: HydrateFromType ) => T);
export interface SerializableInterface { toJSON?: Function }

export type SerializablePropertyTransformer<Normal, Transformed = JsonType<Normal> > = {
	toJSON?:	( val: Normal      ) => Transformed,
	fromJSON?:	( val: Transformed ) => Normal
}
export type SerializablePropertyData<T, Normal=any, Transformed = JsonType<Normal>> = {
	//Identifier:	keyof T,
	//Type:		T,
	Ignored?:	true,
	Transform?:	SerializablePropertyTransformer<Normal, Transformed>
}
export type SerializableTypeData<T, HydrateFromType extends JsonType = JsonType<T>> = {
	Name:	string,
	Class:	Class<T>,

	Constructor:	( this: Class<T>,	data: HydrateFromType ) => T,		// Constructs the type, optionally using the hydrating data
	FromJSON?:		( this: T,			data: HydrateFromType ) => void,	// Hydrates the constructed instance

	Properties: { [K in keyof T]?: SerializablePropertyData<T[K]>}

	//Hydrator:	 null | Hydrator<T, HydrateFromType>,
}

// Required to deserialize by type name string
const name_to_info_lut: Map< string, SerializableTypeData<any> > = new Map();

function GetInfoByName<T, K>( target_name: string ): SerializableTypeData<T, K>
{
	const info = name_to_info_lut.get( target_name );
	if ( info === undefined )
	{
		throw new Error( `\`${target_name}\` couldn't be deserialized! Has the class' name changed since this JSON was authored? The name was not found in the current runtime reflection.` );
	}
	return info;
}

export function DefaultHydrator<
	T extends object,
	H extends JsonType = JsonType<T>
>( this: Class<T>, data: H ): any
{
	if ( typeof data === 'object' ) {
		// Try the regular constructor and override it's properties with the value.
		// If that fails, force it into existence with data bashing.
		try {
			return Object.assign( Reflect.construct( this, Object.values( data as object ) ) as object, data ) as any;
		}
		catch( e )
		{
			console.warn( `Failed to deserialize an instance of \`${this.name}\`\n`, e );
			const out = Object.create( this.prototype, data as any );
		}
	}
	else return data as unknown as T;
}

function GetInfo<T, K>( target: Class<T> ): SerializableTypeData<T, K>
function GetInfo<T, K>( target: Class<T>, bAllowCreate: boolean ): SerializableTypeData<T, K> | undefined
function GetInfo<T, K>( target: Class<T>, bAllowCreate: boolean = true ): SerializableTypeData<T, K> | undefined
{
	let info = Reflect.getMetadata( SerializableMarker, target ) as undefined | SerializableTypeData<T, K>;
	if ( info === undefined && bAllowCreate)
	{
		const mirror = Metadata.Get( target );
		info = {
			Class:	target,
			Name:	mirror.TypeName,

			Constructor: Reflect.get( target, Serializable.constructor, target ) ?? ( ( data: K ) => Object.create( target.prototype, Object.getOwnPropertyDescriptors( data ) ) ),
			FromJSON:	 Reflect.get( target.prototype, 'fromJSON', target.prototype ) as undefined | ( ( this: T, data: K ) => void ),

			Properties: {}
		}
		Reflect.defineMetadata( SerializableMarker, info, target );
		name_to_info_lut.set( info.Name, info );
	}
	return info;
}

export function Serializable<
	T extends object,
	K extends JsonType = JsonType<T>
>( target: Class<T> ): any
{
	// Ensure we mark this class for serialization, which embeds it's typename in the reverse LUT
	GetInfo<T, K>(target);
	
	return target;
}

// == SYMBOLS ==
Serializable.constructor = SerializableConstructor;

Serializable.Ignore = function<T>( target: InstanceOf<T>, prop_name: keyof T )
{
	const info = GetInfo( target.constructor as Class<T> );
	info.Properties[prop_name] = Object.assign( info.Properties[prop_name] ?? {}, { Ignored: true } )
}

Serializable.Transform = function<
	T extends object = any,
	Normal			 = any,
	Transformed		 = JsonType<Normal>
>( property_transformer: SerializablePropertyTransformer<Normal, Transformed> )
{
	// TODO: I might be able to use the return type and an infer to lock `Normal` to be `T[prop_key]`... But leaving that for now
	return function( target: InstanceOf<T>, prop_name: keyof T )
	{
		const info = GetInfo( target.constructor as Class<T> );
		info.Properties[prop_name] = Object.assign( info.Properties[prop_name] ?? {}, { Transform: property_transformer })
	}
}

type TypeOrArrayOfType<T> = T|Array<T>;
Serializable.Soft = function<
	T extends object = any,
	Normal			 = any,
	KeyType extends { toString(): string } = string
>( key_provider: ( in_val: Normal ) => KeyType )
{
	// Specialized form of `Serializable.Transform` that serializes Uuids into the current object
	// and redirects the actual content to a new key in the db adapter.
	// Automatically handles Arrays as an edge case.

	return function( target: InstanceOf<T>, prop_name: keyof T )
	{
		const info = GetInfo( target.constructor as Class<T> );
		info.Properties[prop_name] = Object.assign( info.Properties[prop_name] ?? {}, { Transform:{
			toJSON( v: TypeOrArrayOfType<Normal> ): TypeOrArrayOfType<KeyType>
			{
				if ( Array.isArray( v ) )
				{
					const out = [];
					for( const item of v )
					{
						const key = key_provider( item );
						if ( key === undefined ) continue;
						out.push( key );
						db_adapter.dirty( key.toString(), item );
					}
					return out;
				}
				else
				{
					const key = key_provider( v );
					if ( key !== undefined )
					{
						db_adapter.dirty( key.toString(), v );
					}
					return key;
				}
			},
			fromJSON( v: TypeOrArrayOfType<KeyType> ): TypeOrArrayOfType<Normal>
			{
				if ( Array.isArray( v ) )
				{
					const out = [];
					for( const key of v )
					{
						if ( key === undefined ) continue;
						const item = db_adapter.read<Normal>( key.toString() );
						if ( item === undefined ) continue; // TODO: Throw? Warn?
						out.push( item );
					}
					return out;
				}
				else
				{
					return db_adapter.read<Normal>( v.toString() ) as Normal;
				}
			}
		}})
	}
}



// SERIALIZERS
function replacer( this: any, key: string, json_value: any ): any
{
	// console.log( `==== replacer ====`);
	const original_value = this[key];
	let out = json_value;

	if ( typeof this === 'object' )
	{
		const this_info = GetInfo<any, any>( this.constructor );
		const this_key_info = this_info.Properties[key as keyof {}] ?? undefined;
		if ( this_key_info )
		{
			if( this_key_info.Ignored ) out = undefined; // Mark as undefined to remove from output
			if( this_key_info.Transform?.toJSON !== undefined )
			{
				out = this_key_info.Transform.toJSON.call( this, out );
			}
		}
	}

	if (typeof original_value === 'object' && !key.startsWith( SerializedTypeKeyPrefix ) && !Array.isArray( out )  )
	{
		const info		= GetInfo( original_value.constructor, false );
		if ( info !== undefined )
		{
			const type_key	= `${SerializedTypeKeyPrefix}${info.Name}`;
			
			if ( typeof out !== 'object' || !( type_key in out ) )
			{
				out = { [`${SerializedTypeKeyPrefix}${info.Name}`]: json_value }
			}
		}
	}

// 	console.log( ` - this:  `, this, `
//  - key:   `, key, `
//  - value: `, json_value, `
// ==> replaced with: `, out
// 	);
	return out;
}

Serializable.toJSON = function<T>( inData: T, bIsPretty: boolean = false ): string
{
	// console.log( `@Serializable.toJSON[Entry]`, inData );
	return JSON.stringify( inData, replacer, bIsPretty ? '\t' : undefined );
}

function reviver( this: any, key: string, value: any ): any
{
// 	console.log( `==== reviver ====
// - this:  `, this, `
// - typeof this: `, typeof this, `
// - key:   `, key, `
// - value: `, value, ``);
	let out = value;

	if ( typeof value === 'object' && !Array.isArray( value ) )
	{
		const keys = Object.keys( value );
		if ( keys.length === 1 && keys[0].startsWith( SerializedTypeKeyPrefix ) )
		{
			// TODO: Check if the value is already the correct type?
			//   Maybe not, it might not be possible for the sub object to get hydrated until it's
			//   being hydrated as part of it's parent

			const type_name = keys[0].slice( SerializedTypeKeyPrefix.length );
			const type_info = GetInfoByName<any, any>( type_name );
			const type_value = value[keys[0]];
			
			// Create a wrapper around the data (if it's an object) to allow the user of the
			// returned value to convert values on the fly
			const wrapped = typeof type_value !== 'object' ? type_value : new Proxy( type_value, {
				getOwnPropertyDescriptor( t, p ): PropertyDescriptor | undefined {
					const prop_info = type_info.Properties[p as keyof object];
					const out = Reflect.getOwnPropertyDescriptor( type_value, p );
					if ( out === undefined || prop_info === undefined ) return out;

					if ( prop_info.Ignored ) return undefined;
					if ( prop_info.Transform?.fromJSON )
					{
						// Run the transformer to mutate the value in the descriptor when it's returned
						out.value = prop_info.Transform.fromJSON( out.value );
					}
					return out;
				}
			})
			if ( type_info )
			{
				out = type_info.Constructor.call( type_info.Class, wrapped );
				if ( type_info.FromJSON )
				{
					type_info.FromJSON.call( out, wrapped );
				}
			}
			else
			{
				throw new SyntaxError( `Invalid or unknown type: ${type_name}` );
			}
		}
	}

	// console.log( `=> revived as: `, out );
	return out;
}

Serializable.fromJSON = function<T>( inString: string ): T
{
	return JSON.parse( inString, reviver ) as T;
}