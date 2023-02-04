/**
 * Common Symbols for Metadata
 */

import type { Constructor, PrototypeOf } from "../util/types";

export class ReflectionFailedToInstantiateError extends Error
{
	constructor( type_name: string, stub_constructor: Function|null, base_error: Error )
	{
		let message = `Reflection failed to instantiate \`${type_name}\`.`;
		if ( stub_constructor === null )
		{
			message += ` No stub constructor was provided as an alternative!`;
		}
		message += `\nReason: ${base_error.message}`
		super( message, { cause: base_error } );
		this.stack = `${base_error.stack?.split( '\n' ) [1]}\n${this.stack}`
	}
};
export class ReflectionConfigurationError extends Error
{
	constructor( message: string, base?: Error )
	{
		super( message );
		this.stack = base?.stack ?? this.stack;
	}
}
export class ReflectionError extends Error { }

export namespace Reflection
{
	const name_to_type_lut: Map< string, Mirror<any>> = new Map();


	export function MakeInstance<T extends object>( class_type: abstract new (...args: any[] ) => T, stub_constructor: StubConstructor<T> | null ): T
	{
		try
		{
			// Try the regular constructor with zero args, as we'll rely on the data hydrator to fill out the data
			return Reflect.construct( class_type, [] );
		}
		catch( e1: any )
		{
			// Regular constructor failed, try with a stub constructor
			if ( stub_constructor === null ) throw new ReflectionError(
				`Base constructor failed with zero arguments: ${e1.message}\nNo stub constructor provided`,
				e1 as Error
			)
			else
			{
				try 
				{
					return stub_constructor();
				}
				catch ( e2: any )
				{	// Stub constructor failed!
					throw new ReflectionError(
						`Base constructor failed with zero arguments: ${e1.message}\nStub constructor also failed: ${e2.message}`,
						e2 as Error
					)
				}
			}
		}
	}

	// Symbols
	const DesignNameSymbol:			unique symbol = Symbol( "@Reflection::DesignNameSymbol"			);
	const StubConstructorSymbol:	unique symbol = Symbol( "@Reflection::StubConstructorSymbol"	);
	const MetadataSymbol:			unique symbol = Symbol( "@Reflection::MetadataSymbol"			);

	type Properties<T>		= { [K in keyof T]: { Identifier: string|symbol, Type: T[K], Descriptor: TypedPropertyDescriptor<T[K]> } }
	type DesignInfo			= { Identifier: string }
	type StubConstructor<T>	= () => T;
	
	function IntrospectPropertiesOf<T extends object>( prototype: PrototypeOf<T>, stub_constructor: StubConstructor<T> | null ): Properties<T>
	{
		const out_props: Properties<T> = {} as Properties<T>;

		// Try and spawn an instance after setting the basic data required for it
		const instance: T = Reflection.MakeInstance( prototype.constructor, stub_constructor );

		// Inspect members of the prototype and instance to determine all fields and properties.
		const members = Reflect.ownKeys( prototype ).concat( Reflect.ownKeys( instance ) );

		for ( const member of members )
		{
			if ( member === 'constructor' ) continue; // Already have the ctor, it's the decorator parameter
			let introspection: TypedPropertyDescriptor<any> | undefined = Reflect.getOwnPropertyDescriptor( instance, member );
			
			if ( introspection !== undefined )
			{	// Type exists on instance only, must be a property
				Reflect.set( out_props, member, {
					Identifier: member,
					Descriptor: introspection
				} );
			}
			else if ( ( introspection = Reflect.getOwnPropertyDescriptor( prototype, member ) ) !== undefined )
			{	// Type exists on prototype, must be function or accessor
				if ( typeof introspection.value === 'function' )
				{	// Descriptor is for a function
					Reflect.set( out_props, member, {
						Identifier:	member,
						Descriptor:	introspection
					})
				}
				else
				{	// Descriptor is for an accessor
					Reflect.set( out_props, member, {
						Identifier: member,
						Descriptor: introspection
					} );
				}
			}
			else
			{
				throw new TypeError( `Unable to reflect \`${member.toString()}\`, unknown member type` );
			}
		}

		return out_props;
	}

	function IntrospectStubConstructorOf<T extends object>( prototype: PrototypeOf<T> ): StubConstructor<T>
	{
		return Reflect.get( prototype, StubConstructorSymbol ) as StubConstructor<T>;
	}

	function IntrospectDesignInfoOf<T extends object>( prototype: PrototypeOf<T> ): DesignInfo
	{
		if ( !Reflect.has( prototype, DesignNameSymbol ) )
		{
			let cur_prototype;
			let name: string|undefined;
			
			// If the name is undefined, walk up the prototype chain until we find _something_
			do {
				cur_prototype	= prototype;
				name			= cur_prototype.constructor.name;
			}
			while( cur_prototype && typeof name !== 'string' );

			Reflect.set( prototype, DesignNameSymbol, name );
		}
		return {
			Identifier: Reflect.get( prototype, DesignNameSymbol ) as string
		}
	}

	class Mirror<T extends object>
	{
		private readonly _prototype:		PrototypeOf<T>;
		private			 _properties:		Properties<T>		| null = null;
		private			 _design_info:		DesignInfo			| null = null;
		private			 _stub_constructor:	StubConstructor<T>	| null = null;
		
		public  readonly ClassType: abstract new( ...args: any[] ) => T;
		

		public get StubConstructor(): StubConstructor<T>
		{
			if ( this._stub_constructor === null )
			{
				this._stub_constructor = IntrospectStubConstructorOf( this._prototype );
			}
			return this._stub_constructor as StubConstructor<T>;
		}

		public get DesignInfo(): DesignInfo
		{
			if ( this._design_info === null )
			{
				this._design_info = IntrospectDesignInfoOf( this._prototype );
			}
			return this._design_info as DesignInfo;
		}

		public get Properties(): Properties<T>
		{
			if ( this._properties === null )
			{
				this._properties = IntrospectPropertiesOf( this._prototype, this.StubConstructor );
			}
			return this._properties as Properties<T>;
		}

		constructor( prototype: PrototypeOf<T> )
		{
			this._prototype	= prototype;
			this.ClassType	= prototype.constructor;
		}
	}

	export function GetByName<T extends object>( type_name: string ): Mirror<T>
	{
		const mirror: undefined | Mirror<T> = name_to_type_lut.get( type_name );
		if ( mirror === undefined ) throw new ReflectionError( `\`${type_name}\` could not be found in the reverse lookup! Has the class' name changed?` );
		return mirror;
	}

	export function Get<T extends object>( prototype: PrototypeOf<T> ): Mirror< T >
	{
		let cur_mirror = Reflect.get( prototype, MetadataSymbol ) as undefined | Mirror<T>;
		if ( cur_mirror === undefined )
		{
			cur_mirror = new Mirror( prototype );
			Reflect.set( prototype, MetadataSymbol, cur_mirror );

			// Cache the identifier for reverse lookup
			if ( name_to_type_lut.has( cur_mirror.DesignInfo.Identifier ) ){
				const warning = `Type name collision! \`${cur_mirror.DesignInfo.Identifier}\` was already present in the lookup table. Type names should be unique when they're reflected.`
				console.warn( warning );
			}
			name_to_type_lut.set( cur_mirror.DesignInfo.Identifier, cur_mirror );
		}
		
		return cur_mirror;
	}

	export function PreserveMetadata<T>( base_class: Constructor<T> )
	{
		const mirror = Get( base_class.prototype );
		// Invoke properties to cache the data
		mirror.ClassType;
		mirror.DesignInfo;
		mirror.StubConstructor;
		mirror.Properties;

		return base_class as abstract new(...args:any[])=>T; // Simply return the original type for usage
	}

	// Decorators
	export function StubConstructor<T extends object>( stub_constructor: () => T )
	{
		return function( target: Constructor<T> ) {
			Reflect.set( target.prototype, StubConstructorSymbol, stub_constructor );
		}
	}
}