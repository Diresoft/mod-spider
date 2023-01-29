import type { Mod } from "../mod/Mod";
import type { Constructor, NonFunctionProperties } from "../util/types";
import { Reflection } from "./reflection";

export namespace Serialize
{
	const name_to_info_lut: Map< string, SerializationInfo<any>> = new Map();

	// SYMBOLS

	const SerializeInfoSymbol: unique symbol = Symbol( "@Serialize::SerializeInfoSymbol" );

	// TYPES

	export type SerializeTransformer<T> = {
		out:	( val: T ) => any,
		in:		( val: any ) => T
	}

	export type TypedSerializeDescriptor<T> = {
		Ignore?: boolean,
		Transformer?: SerializeTransformer<T>
	}

	class SerializeDescriptorLUT<T>
	{
		private lut: { [K in keyof T]?: TypedSerializeDescriptor<T[K]> } = {};

		static Get<T extends object>( target: T ): SerializeDescriptorLUT<T>
		{
			let out: SerializeDescriptorLUT<T> | undefined = Reflect.get( target, SerializeInfoSymbol ) as SerializeDescriptorLUT<T> | undefined;
			if ( out === undefined )
			{
				out = new SerializeDescriptorLUT<T>();
				Reflect.set( target, SerializeInfoSymbol, out );
			}
			
			return out;
		}

		defineProperty( prop: keyof T, descriptor: Partial<TypedSerializeDescriptor<T[typeof prop]>> )
		{
			const cur: TypedSerializeDescriptor<T[typeof prop]> = this.lut[prop] ?? {};
			Object.assign( cur, descriptor );
			this.lut[ prop ] = cur;
		}

		getProperty( prop: keyof T ): TypedSerializeDescriptor<T[typeof prop]>
		{
			return this.lut[ prop ] ?? {};
		}
	}

	// HELPERS
	
	// DECORATORS

	export function Customize<P>( descriptor: TypedSerializeDescriptor<P>)
	{
		return function<T extends object>( target: T, prop: keyof T )
		{
			const info = SerializeDescriptorLUT.Get<T>( target );
			info.defineProperty( prop, descriptor as TypedSerializeDescriptor<T[typeof prop]>);
		}
	}

	// SERIALIZERS

	function replacer<T extends object>( this: T, key: keyof T, value: any ): any
	{
		// @ts-ignore replacer has a mutating this type which is incompatible when it's the root.
		if( this[""] !== undefined ) return value; // Accept the step into
		
		const infoLUT	= SerializeDescriptorLUT.Get<T>( this );
		const info		= infoLUT.getProperty( key );

		if ( !info )			return value;
		if ( info.Ignore )		return undefined;
		if ( info.Transformer )	return info.Transformer.out( value );

		return value;
	}
	export function toJSON<T extends object>( inData: T, bIsPretty: boolean = false ): string
	{
		console.log( `@Serialize.toJSON( inData:`, inData, `, bIsPretty: ${bIsPretty} )` );

		// If we have reflection data for this type, we can annotate it's type in the output
		try
		{
			const meta	= Reflection.Get( inData );
			const typed	= inData as InstanceType<typeof meta.ClassType>
	
			let dehydrated = 'toJSON' in meta.Properties ? typed.toJSON() : typed;
			console.log( dehydrated );
	
			//return JSON.stringify( inData, replacer, bIsPretty ? '\t' : undefined );
			return JSON.stringify( {
					_type: meta.DesignInfo.Identifier,
					_value: dehydrated,
				},
				replacer,
				bIsPretty ? '\t' : undefined
			);
		}
		catch( e )
		{
			console.warn( `Unable to annotate type during serialization. No reflection found.`, inData );
			return JSON.stringify( inData, null, bIsPretty ? '\t' : undefined )
		}
	}

	function reviver( key: string|symbol, value: any ): any
	{
		if (
			   typeof value !== 'object'
			|| value === null
			|| !( '_type'  in value )
			|| !( "_value" in value )
		) return value; // TODO: Run reverse transformer?

		//console.log( `@Serialize::reviver( key: ${key.toString() }, value: `, value, ` )`);
		const mirror = Reflection.GetByName( value._type );
		//console.log( `revive as:`, mirror.ClassType );

		// const out = {};
		// Object.setPrototypeOf( out, mirror.ClassType );
		// Object.assign( out, value._value );

		// console.log( `Revived:`, out );

		return undefined;
	}
	export function fromJSON<T extends object>( inJson: string ): T
	{
		return JSON.parse( inJson, reviver ) as T;
	}
}