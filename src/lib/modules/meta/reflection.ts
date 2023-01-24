/**
 * Common Symbols for Metadata
 */

import type { Mod } from "../mod/Mod";
import type { Guid } from "../util/Guid";
import type { Constructor, FunctionProperties, TypedMethodFields, TypedObjectDescriptor, TypedPropertyFields } from "../util/types";

type StubConstructor<T> = () => T;

export class ReflectionError extends Error { }

function MakeInstance<T>( generic: Constructor<T>, stub_constructor: StubConstructor<T> | null = null ): T
{
	try
	{
		return Reflect.construct( generic, [] );
	}
	catch( e )
	{
		if ( stub_constructor === null ) throw new ReflectionError( `Type<${generic.name}> can't be constructed with no constructor args. Ensure a stub constructor is provided for this type.` );
		return stub_constructor();
	}
}

export namespace Reflection
{
	// Symbols
	const Metadata:		unique symbol = Symbol( "@Reflection:Metadata"		);

	// Types
	export type ReflectionInfo<T> = {
		ClassName:	string,
		ClassType:	abstract new ( ...args: any[] ) => T,
		Properties:	TypedPropertyFields<T>,
		Methods:	TypedMethodFields<T>
	}
	type MetaPromise<T> = {
		p: Promise<ReflectionInfo<T>>,
		r: ( v: ReflectionInfo<T> | Promise<ReflectionInfo<T>> ) => void
	}

	export function Get<T extends object>( target: T ): Promise<ReflectionInfo<T>>
	{
		if ( !Reflect.has( target, Metadata ) )
		{
			let r : ( v: ReflectionInfo<T> | Promise<ReflectionInfo<T>> ) => void = () => {};
			const p = new Promise( (res)=> { r = res } );
			Reflect.set( target, Metadata, { p, r } )
		}
		return (Reflect.get( target, Metadata ) as MetaPromise<T>).p as Promise<ReflectionInfo<T>>;
	}

	// Decorators
	export function Class<T extends object>( stub_constructor: StubConstructor<T> | null = null )
	{
		return function( target: Constructor<T> ): void
		{
			const info: ReflectionInfo<T> = {
				ClassName:	target.name,
				ClassType:	target as new ( ...args: any[] ) => T,
				Properties: {} as TypedPropertyFields<T>,
				Methods:	{} as TypedMethodFields<T>
			};
			const instance: T = MakeInstance( target, stub_constructor );

			// Inspect members of the prototype and instance to determine all fields and properties.
			const members	= Reflect.ownKeys( instance ).concat( Reflect.ownKeys( target.prototype ) );
			for ( const member of members )
			{
				if ( member === 'constructor' ) continue; // Already have the ctor, it's the decorator parameter
				let introspection: TypedPropertyDescriptor<any> | undefined = Reflect.getOwnPropertyDescriptor( instance, member );
				
				if ( introspection !== undefined )
				{	// Type exists on instance only, must be a property
					Reflect.set( info.Properties, member, introspection );
				}
				else if ( ( introspection = Reflect.getOwnPropertyDescriptor( target.prototype, member ) ) !== undefined )
				{	// Type exists on prototype, must be function or accessor
					if ( typeof introspection.value === 'function' )
					{	// Descriptor is for a function
						Reflect.set( info.Methods, member, {
							name:		member,
							descriptor:	introspection
						})
					}
					else
					{	// Descriptor is for an accessor
						Reflect.set( info.Properties, member, introspection );
					}
				}
				else
				{
					throw new TypeError( `Reflection failed for Class<${target.name}>. Member \`${member.toString()}\` was not understood` );
				}
			}

			// Trigger or set the resolved promise for metadata
			const prototype = target.prototype;
			if ( Reflect.has( prototype, Metadata ) )
			{
				const { r } = Reflect.get( prototype, Metadata );
				r( info );
			}
			Reflect.set( prototype, Metadata, { p: Promise.resolve( info ), r: undefined } ); // Replace the promise chain with a single resolved promise
		}
	}
}