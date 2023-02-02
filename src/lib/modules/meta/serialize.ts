import type { Mod } from "../mod/Mod";
import type { Constructor, NonFunctionProperties } from "../util/types";
import { Reflection } from "./reflection";

export class SerializeConfigurationError extends Error {}
export class SerializationError extends Error
{
	constructor( message: string, base?: Error )
	{
		super( message );
		this.stack = base?.stack ?? this.stack;
	}
}

export namespace Serialize
{
	const name_to_info_lut: Map< string, SerializationInfo<any>> = new Map();

	// SYMBOLS

	const SerializationInfoSymbol: unique symbol = Symbol( "@Serialize::SerializeInfoSymbol" );

	// TYPES
	export type SerializeTransformer<T> = {
		out:	( val: T )		=> any,
		in:		( val: any )	=> T
	}
	export type PropertySerializationOptions<T> = {
		Identifier:	keyof T,
		Type:		T,
		Ignored?:	true,
		Transform?:	SerializeTransformer<T>
	}

	export class SerializationInfo<T extends object>
	{
		public TypeHydrator:	null | (( value: any ) => T )							= null;
		public Hydrator:		null | (( this: T, value: any ) => void)				= null;
		public Properties:		{ [K in keyof T]?: PropertySerializationOptions<T[K]> }	= {};
		constructor() {}
	}

	// HELPERS

	export function GetByName<T extends object>( type_name: string ): SerializationInfo<T>
	{
		const mirror: undefined | SerializationInfo<T> = name_to_info_lut.get( type_name );
		if ( mirror === undefined ) throw new SerializeConfigurationError( `\`${type_name}\` could not be found in the reverse lookup! Has the class' name changed?` );
		return mirror;
	}

	export function Get<T extends object>( prototype: T ): SerializationInfo<T>
	{
		const meta = Reflection.Get( prototype );
		const info = Reflect.get( prototype, SerializationInfoSymbol ) as SerializationInfo<T> ?? new SerializationInfo<T>;
		name_to_info_lut.set( meta.DesignInfo.Identifier, info );
		Reflect.set( prototype, SerializationInfoSymbol, info );

		return info;
	}

	// DECORATORS

	export function Manage<T extends object>( options?: Partial<Omit<SerializationInfo<T>, 'Properties'>> )
	{
		return function( target: Constructor<T> )
		{
			const meta			= Reflection.Get( target.prototype );
			const base_toJSON	= target.prototype.toJSON ?? function ( this: T ){ return this; };
			const info			= Get( target.prototype );

			if ( !options || options.TypeHydrator === undefined )
			{	// User doesn't define a choice, use default
				info.TypeHydrator = ( _: any ): T => {
					try
					{
						// Try the regular constructor with zero args, as we'll rely on the data hydrator to fill out the data
						return Reflect.construct( meta.ClassType, [] );
					}
					catch( e: any )
					{
						// Regular constructor failed, try with a stub constructor
						if ( meta.StubConstructor === null ) throw new SerializationError(
							`Unable to deserialize object annotated as \`${meta.DesignInfo.Identifier}\`\nReason: ${(e as Error).message}\n No stub constructor was provided`,
							e as Error
						)
						else
						{
							try 
							{
								return meta.StubConstructor();
							}
							catch ( e )
							{	// Stub constructor failed!
								throw new SerializationError(
									`Unable to deserialize object annotated as \`${meta.DesignInfo.Identifier}\`\nStub constructor failed\nReason:${(e as Error).message}`,
									e as Error
								)
							}
						}
					}
				};
			}
			else if ( options && options.TypeHydrator !== null && typeof options.TypeHydrator === 'function' )
			{	// User has defined a choice, use it
				info.TypeHydrator = options.TypeHydrator;
			}
			else if ( options )
			{	// Anything else is an error for the type hydrator
				throw new SerializeConfigurationError( `Type \`${meta.DesignInfo.Identifier}\` must define a valid Type Hydrator, or provide no definition to use the default functionality` );
			}
			
			if ( !options || options.Hydrator === undefined )
			{	// No defined behavior by the user, use default
				info.Hydrator = function( this: T, value: any ): void { Object.assign( this, value ); }
			}
			else if ( options && ( options.Hydrator === null || typeof options.Hydrator === 'function' ) )
			{	// User defined behavior for the hydrator. Use it. Null means do nothing!
				info.Hydrator = options.Hydrator;
			}
			else if ( options && typeof options.Hydrator !== 'function' )
			{
				throw new SerializeConfigurationError( `Invalid type provided as Hydrator for \`${meta.DesignInfo.Identifier}\``)
			}

			// Customize the toJSON to return a type annotated object
			target.prototype.toJSON = function( this: T )
			{
				// If the target type doesn't have a toJSON, we'll end up recursively calling this implementation
				// when the returned annotated object attempts to serialize the _value member.
				// To prevent that, ensure the instance has a `toJSON` defined. Use the stub if it didn't have it's own
				Reflect.set( this, 'toJSON', base_toJSON );
				return {
					_type:	meta.DesignInfo.Identifier,
					_value:	this
				}
			}
		}
	}
	
	export function ConfigureProperty( options: any )
	{
		return function<T extends object>( target: T, prop: keyof T )
		{			
			const info = Get( target );
			info.Properties[ prop ] = Object.assign( info.Properties[ prop ] ?? {}, options );
		}
	}

	// SERIALIZERS

	function replacer<T extends object>( this: T, key: keyof T, value: any ): any
	{
		// @ts-ignore - replacer has a mutating this type which is incompatible when it's the root.
		if( this[""] !== undefined ) return value; // Accept the step into
		
		if ( !Reflect.has( this, SerializationInfoSymbol ) ) return value;

		const info = Get( this ).Properties[ key ];
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
		
		const meta			= Reflection.GetByName( value._type );
		const info			= GetByName( value._type );
		const wrapped_value = typeof value._value !== 'object' ? value._value : new Proxy( value._value, {
			// Intercept the getter so we can reverse transform, as well as ensure any ignored props remain ignored.
			get: ( t: any, p: string | symbol, r: any ) =>
			{
				const prop_info = Reflect.get( info.Properties, p ) as undefined | PropertySerializationOptions<any>;
				if ( prop_info === undefined	) return Reflect.get( t, p, r );
				if ( prop_info.Ignored			) return undefined;
				if ( prop_info.Transform		) return prop_info.Transform.in( Reflect.get( t, p, r ) );
			}
		} );

		if ( info.TypeHydrator === null ) throw new SerializeConfigurationError( `Type \`${meta.DesignInfo.Identifier}\` had an invalid serialization configuration at deserialization time! Type Hydrator was null` );
		const instance = info.TypeHydrator( wrapped_value ) as T;
		
		if ( info.Hydrator !== null ) info.Hydrator.call( instance, wrapped_value );

		return instance;
	}

	export function fromJSON<T extends object>( inString: string ): T
	{
		return JSON.parse( inString, reviver ) as T;
	}
}