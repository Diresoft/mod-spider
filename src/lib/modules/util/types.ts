/**
 * Generic or multipurpose TypeScript "types" or classes.
 * Mostly utility, providing features/abilities that aren't part of the core TypeScript language
 */


// Non function properties types, from: https://stackoverflow.com/questions/55479658/how-to-create-a-type-excluding-instance-methods-from-a-class-in-typescript
export type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K; // eslint-disable-line @typescript-eslint/ban-types
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type FunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

// Class Types
abstract	class abstract_private_clazz	{ private	constructor( ...args: any[] ) {} }
			class private_clazz				{ private	constructor( ...args: any[] ) {} }
abstract	class abstract_protected_clazz	{ protected	constructor( ...args: any[] ) {} }
			class protected_clazz			{ protected	constructor( ...args: any[] ) {} }

export type _abstract_private_ctor		= typeof abstract_private_clazz;
export type _private_ctor				= typeof private_clazz;
export type _abstract_protected_ctor	= typeof abstract_protected_clazz;
export type _protected_ctor				= typeof protected_clazz;
export type _abstract_ctor				= abstract new( ...args: any[] ) => any;
export type _ctor						= new( ...args: any[] ) => any //typeof clazz;

export type _ctor_any					= _ctor | _abstract_ctor | _protected_ctor | _abstract_protected_ctor | _abstract_private_ctor


export type Clazz<T> = { prototype: T }

export type Constructor<T> = Function & { prototype: T, name: string };



export type TypedFunctionDescriptor<T, P> =
	T extends ( ...args: any[] ) => any
	? {
		name:		P,
		descriptor:	TypedPropertyDescriptor<T>,
		parameters:	Parameters<T>,
		return:		ReturnType<T>
	}
	: never;


// Generative type which declares an object containing the Typed Property Descriptors for the members of T
export type TypedObjectDescriptor<T> = { [P in keyof T]: TypedPropertyDescriptor<T[P]> }
export type TypedMethodFields<T>	= { [P in keyof FunctionProperties<T>		]: TypedFunctionDescriptor<T[P], P>	}
export type TypedPropertyFields<T>	= { [P in keyof NonFunctionProperties<T>	]: TypedPropertyDescriptor<T[P]>	}




/** A promise which never resolves */ 
export const FOREVER = new Promise<void>( () => {} );