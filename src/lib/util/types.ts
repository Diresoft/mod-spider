/**
 * Generic or multipurpose TypeScript "types" or classes.
 * Mostly utility, providing features/abilities that aren't part of the core TypeScript language
 */

export type PartialMap<T, MT> = Partial<{[property in keyof T]: MT}>

// Class and Constructor related typing
export abstract class PrivateEmptyClass { private constructor( ...args:any[] ){} }
export type Class<T = {}> = typeof PrivateEmptyClass & { prototype: T }
export type InterfaceConstructor<I> = { new(): I }
export type ConstructorOf<T> = 
	T extends InstanceType<infer P>
	? new (...args: ConstructorParameters<P>) => T
	: never
;
export type InstanceOf<T> = { constructor: Class<T>|Function }

// Non function properties types, from: https://stackoverflow.com/questions/55479658/how-to-create-a-type-excluding-instance-methods-from-a-class-in-typescript
export type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K; // eslint-disable-line @typescript-eslint/ban-types
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type FunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

// Ripped from svelte's code
export type __Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;



// Specialized property descriptor for methods
export type TypedMethodDescriptor<T> =
	T extends ( ...args: any[] ) => any
	? {
		name:		string|symbol,
		descriptor:	TypedPropertyDescriptor<T>,
		parameters:	Parameters<T>,
		return:		ReturnType<T>
	}
	: never;


// Generative type which declares an object containing the Typed Property Descriptors for the members of T
export type TypedObjectDescriptor<T> = { [P in keyof T]: TypedPropertyDescriptor<T[P]> }
export type TypedMethodFields<T>	= { [P in keyof FunctionProperties<T>		]: TypedMethodDescriptor<T[P]>	}
export type TypedPropertyFields<T>	= { [P in keyof NonFunctionProperties<T>	]: TypedPropertyDescriptor<T[P]>	}

// JSON type helpers
export type JsonKeyType							= number|string;
export type JsonKeysOf<T>						= { [K in keyof T]: K extends JsonKeyType ? T[K] extends Function ? never : K : never }[keyof T];
export type JsonPrimitive						= boolean|number|string|null;
export type JsonArray<T = JsonType>				= T[]
export type JsonObject< T extends object = {} > = Partial<{ [K in JsonKeysOf<T>]: JsonType<T[K]>} >
export type JsonType<T = any>					= T extends JsonPrimitive
													? T
													: T extends Array<infer R>
														? JsonArray<JsonType<R>>
														: T extends object
															? JsonObject<T>
															: never

/** A promise which never resolves */ 
export const FOREVER = new Promise<void>( () => {} );
