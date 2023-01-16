/**
 * Common Symbols for Metadata
 */

import type { _ctor, _private_ctor, _protected_ctor } from "../util/types";

const REFLECTION: unique symbol = Symbol( "@Reflection::Design::REFLECTION");
export namespace Design {
	export const TypeName:		unique symbol = Symbol(	"@Reflection::Design::TypeName"		);
}
type _ctor_any = _ctor | _private_ctor | _protected_ctor;

export class DireFieldInfo<T extends _ctor_any> implements TypedPropertyDescriptor<T>
{
	// Inherited
	//public value?:			T;
	public configurable?:	boolean;
	public enumerable?:		boolean;
	public writable?:		boolean;

	// Added
	public type?:			string;

	constructor( base: TypedPropertyDescriptor<T> )
	{
		//this.value			= base.value;
		this.configurable	= base.configurable;
		this.enumerable		= base.enumerable;
		this.writable		= base.writable;

		this.type			= base.value?.constructor.name;
	}
}
export class DireMetadata<T extends _ctor_any>
{
	public name: string;
	public ctor: T;
	public properties:	Map<string|symbol, DireFieldInfo<any> > = new Map();
	public methods:		Map<string|symbol, DireFieldInfo<any> > = new Map();
	public accessors:	Map<string|symbol, DireFieldInfo<any> > = new Map();

	constructor( name: string, ctor: T )
	{
		this.name = name;
		this.ctor = ctor;
	}
}
const _mirror:			Map<_ctor_any, DireMetadata<_ctor_any>>	= new Map();

export class DireReflection
{
	public static Reflect<T extends _ctor_any>	( target: T ):		DireMetadata<T>
	{
		if ( !_mirror.has( target ) ) throw new TypeError( `Type<${target.name}> is not reflected. Ensure the @DireReflection type decorator is lowest in the stack`)
		return _mirror.get( target ) as DireMetadata<T>;
	}

	public static Class<T extends _ctor_any >( stub_constructor: ( () => InstanceType<_ctor> ) | null = null  )
	{
		return function( target: T ): void
		{
			const reflection: DireMetadata<T> = new DireMetadata( target.name, target ); // The reflection data
			
			// Create an instance of the class to inspect for properties, as non functional properties don't exist on the prototype
			let _instance;
			try
			{
				_instance = Reflect.construct( target, [ ] );
			}
			catch( e )
			{
				if ( stub_constructor !== null )
				{
					_instance = stub_constructor();
				}
				else
				{
					throw new SyntaxError( `Class<${target.name}> could not be constructed with zero arguments and has no provided stub constructor` );
				}
			}

			// Inspect members of the prototype and instance to determine all fields and properties.
			const members	= Reflect.ownKeys( _instance ).concat( Reflect.ownKeys( target.prototype ) );
			for ( const member of members )
			{
				if ( member === 'constructor' ) continue; // Already have the ctor, it's the decorator parameter
				let introspection: TypedPropertyDescriptor<any> | undefined = Reflect.getOwnPropertyDescriptor( _instance, member );
				
				if ( introspection !== undefined )
				{	// Type exists on instance only, must be a property
					reflection.properties.set( member, new DireFieldInfo( introspection ) );
				}
				else if ( ( introspection = Reflect.getOwnPropertyDescriptor( target.prototype, member ) ) !== undefined )
				{	// Type exists on prototype, must be function or accessor
					if ( typeof introspection.value === 'function' )
					{	// Descriptor is for a function
						reflection.methods.set( member, new DireFieldInfo( introspection ) );
					}
					else
					{	// Descriptor is for an accessor
						reflection.accessors.set( member, new DireFieldInfo( introspection ) );
					}
				}
				else
				{
					throw new TypeError( `Reflection failed for Class<${target.name}>. Member \`${member.toString()}\` was not understood` );
				}
			}
			_mirror.set( target, reflection );
		}
	}
}