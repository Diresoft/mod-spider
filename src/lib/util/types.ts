/**
 * Generic or multipurpose TypeScript "types" or classes.
 * Mostly utility, providing features/abilities that aren't part of the core TypeScript language
 */


// Non function properties types, from: https://stackoverflow.com/questions/55479658/how-to-create-a-type-excluding-instance-methods-from-a-class-in-typescript
export type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K; // eslint-disable-line @typescript-eslint/ban-types
}[keyof T];
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type Constructor = { new (...args: any[]): any }; // eslint-disable-line @typescript-eslint/no-explicit-any