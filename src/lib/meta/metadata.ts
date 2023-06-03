import "reflect-metadata";
import type { Class, PartialMap } from "../util/types";

export const DesignInfo: unique symbol = Symbol("@@Metadata::DesignInfo");
export type ClassFieldInfo<T, C extends Class> = {
	Prop: keyof T,
	Type?: C
}
export type ClassDesignInfo<T> = {
	Name: string,
	Constructor: Class<T>,
	Fields: PartialMap<T, ClassFieldInfo<T, any>>
}

function getClassInfo<T>( constructor: Class<T> ): ClassDesignInfo<T>
{
	let out: ClassDesignInfo<T>|null = null;
	if ( !Reflect.hasMetadata( DesignInfo, constructor ) )
	{	// Define with defaults
		out = { Name: constructor.name, Constructor: constructor, Fields: {} };
		Reflect.defineMetadata( DesignInfo, out, constructor );
	}
	else
	{
		out = Reflect.getMetadata( DesignInfo, constructor ) as ClassDesignInfo<T>;
	}
	return out;
}
function getFieldInfo<T, C extends Class>( constructor: Class<T>, prop: keyof T ): ClassFieldInfo<T, C>
{
	const class_info = getClassInfo( constructor );
	let out = class_info.Fields[prop];
	if ( out === undefined )
	{
		out = { Prop: prop }
		class_info.Fields[prop] = out;
	}
	return out;
}
function putClassInfo<T>( constructor: Class<T>, info: Partial<ClassDesignInfo<T>> ): void
{
	Object.assign( getClassInfo( constructor ), info );
}
function putPropertyInfo<T, C extends Class>( constructor: Class<T>, prop: keyof T, field_info: Partial<ClassFieldInfo<T, C>> ): void
{
	Object.assign( getFieldInfo( constructor, prop ), field_info );
}

export function Class<T>( target: Class<T> ): void
{
	putClassInfo( target, { Name: target.name, Constructor: target } );
}
export function Field<T extends Object, C extends Class>( field_type: C ): PropertyDecorator
{
	return function( target: T, prop: keyof T )
	{
		putPropertyInfo( target.constructor as Class<T>, prop, { Type: field_type } );
	} as PropertyDecorator
}

export function GetDesignInfo<T extends Object>( instance: T ): ClassDesignInfo<T> | undefined
export function GetDesignInfo<T extends Object>( constructor: Class<T> ): ClassDesignInfo<T> | undefined
export function GetDesignInfo<T extends Object>( instance_or_constructor: T ): ClassDesignInfo<T> | undefined
{
	if ( 'constructor' in instance_or_constructor )
	{
		return Reflect.getMetadata( DesignInfo, instance_or_constructor.constructor );
	}
	else
	{
		return Reflect.getMetadata( DesignInfo, instance_or_constructor );
	}
}