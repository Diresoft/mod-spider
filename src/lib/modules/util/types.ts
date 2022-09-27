/**
 * Generic or multipurpose TypeScript "types" or classes.
 * Mostly utility, providing features/abilities that aren't part of the core TypeScript language
 */


// Non function properties types, from: https://stackoverflow.com/questions/55479658/how-to-create-a-type-excluding-instance-methods-from-a-class-in-typescript
export type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K; // eslint-disable-line @typescript-eslint/ban-types
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type Constructor<T = any> = abstract new(...args:[])=>T; // eslint-disable-line @typescript-eslint/no-explicit-any
export class PrivateConstructorClass { private constructor() {} };
export type Class = (Constructor | { prototype : PrivateConstructorClass, name : string} );
export type DireInstanceType<T> = T extends abstract new(...args:unknown[])=>unknown ? InstanceType<T> : any;


export const FOREVER = new Promise<void>( () => {} );