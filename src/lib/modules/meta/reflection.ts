/**
 * Common Symbols for Metadata
 */

import type { Constructor } from "../util/types";

type StubConstructor<T> = () => T;

export class ReflectionMissingStubConstructorError extends Error {};
export class ReflectionError extends Error { }

function MakeInstance<T>( generic: Constructor<T>, stub_constructor: StubConstructor<T> | null = null ): T
{
	try
	{
		return Reflect.construct( generic, [] );
	}
	catch( e )
	{
		if ( stub_constructor === null ) {
			throw new ReflectionMissingStubConstructorError(
				`Unable to instantiate a \`${ generic.name }\`. No stub constructor available for this type.`
			);
		}
		return stub_constructor();
	}
}

export namespace Reflection
{
	const name_to_type_lut: Map< string, Mirror<any>> = new Map();

	// Symbols
	const StubConstructorSymbol:	unique symbol = Symbol( "@Reflection::StubConstructorSymbol"	);
	const MetadataSymbol:			unique symbol = Symbol( "@Reflection::MetadataSymbol"			);

	// Types
	export class Mirror<T extends abstract new (...args: any) => any>
	{
		public ClassType: abstract new ( ...args: any[] ) => InstanceType<T>
		public StubConstructor: null | ( ( ) => InstanceType<T> );
		public DesignInfo: {
			Identifier: string
		}
		public Properties: {
			[K in keyof T]: {
				Identifier: string|symbol,
				Type: T[K],
				Descriptor: TypedPropertyDescriptor<T[K]>
			}
		}

		constructor( prototype: InstanceType<T>, stub_constructor: null | ( () => InstanceType<T> ) )
		{
			this.ClassType			= prototype as new (...args: any[] ) => InstanceType<T>;
			this.StubConstructor	= stub_constructor;
			this.Properties			= {} as any; // We're about to fill this out
			this.DesignInfo			= {
				Identifier:	prototype.constructor.name
			}

			const instance: InstanceType<T> = MakeInstance( prototype, this.StubConstructor ); // Properties only exist on instances

			// Inspect members of the prototype and instance to determine all fields and properties.
			const members = Reflect.ownKeys( instance ).concat( Reflect.ownKeys( prototype ) );
			for ( const member of members )
			{
				if ( member === 'constructor' ) continue; // Already have the ctor, it's the decorator parameter
				let introspection: TypedPropertyDescriptor<any> | undefined = Reflect.getOwnPropertyDescriptor( instance, member );
				
				if ( introspection !== undefined )
				{	// Type exists on instance only, must be a property
					Reflect.set( this.Properties, member, {
						Identifier: member,
						Descriptor: introspection
					} );
				}
				else if ( ( introspection = Reflect.getOwnPropertyDescriptor( prototype, member ) ) !== undefined )
				{	// Type exists on prototype, must be function or accessor
					if ( typeof introspection.value === 'function' )
					{	// Descriptor is for a function
						Reflect.set( this.Properties, member, {
							Identifier:	member,
							Descriptor:	introspection
						})
					}
					else
					{	// Descriptor is for an accessor
						Reflect.set( this.Properties, member, {
							Identifier: member,
							Descriptor: introspection
						} );
					}
				}
				else
				{
					throw new TypeError( `Reflection failed for Class<${prototype.name}>. Member \`${member.toString()}\` was not understood` );
				}
			}
		}
	}

	export function GetByName<T extends abstract new (...args: any) => any>( type_name: string )
	{
		const mirror: undefined | Mirror<T> = name_to_type_lut.get( type_name );
		if ( mirror === undefined ) throw new ReflectionError( `\`${type_name}\` could not be found in the reverse lookup! Has the class' name changed?` );
		return mirror;
	}

	export function Get<T extends abstract new (...args: any) => any>( prototype: InstanceType<T> ): Mirror<T>
	{
		const	stub_constructor	= Reflect.get( prototype, StubConstructorSymbol	) as undefined | (() => InstanceType<T>);
		let		cur_mirror			= Reflect.get( prototype, MetadataSymbol		) as undefined | Mirror<T>;

		if ( cur_mirror === undefined ) {
			cur_mirror = new Mirror( prototype, stub_constructor ?? null );
			Reflect.set( prototype, MetadataSymbol, cur_mirror );

			// Cache the identifier for reverse lookup
			if ( name_to_type_lut.has( cur_mirror.DesignInfo.Identifier ) ){
				const warning = `Type name collision! \`${cur_mirror.DesignInfo.Identifier}\` was already present in the lookup table. Type names should be unique when they're reflected.`
				console.warn( warning )
				//throw new ReflectionError( warning );
			}
			name_to_type_lut.set( cur_mirror.DesignInfo.Identifier, cur_mirror );
		}
		
		return cur_mirror;
	}

	export function PreserveMetadata<T>( base_class: abstract new ( ...args: any[] ) => T )
	{
		Get( base_class.prototype ); // Embed the mirror in the prototype for the provided class if needed
		return base_class; // Simply return the original type for usage
	}

	// Decorators
	export function Manage<T extends object>( base_class: Constructor<T> )
	{
		Get( base_class.prototype ); // This is enough to embed the reflection data
	}

	export function StubConstructor<T extends object>( stub_constructor: () => T )
	{
		return function( target: Constructor<T> ) {
			Reflect.set( target.prototype, StubConstructorSymbol, stub_constructor );
		}
	}
}