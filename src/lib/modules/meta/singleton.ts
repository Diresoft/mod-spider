import type { _ctor, _ctor_any, _protected_ctor } from "../util/types";
import { Metadata, type ClassType } from "./metadata";

export const SingletonInstance				: unique symbol = Symbol( "@Singleton:SingletonInstance"			);
export const SingletonPropertyIdentifier	: unique symbol = Symbol( "@Singleton:SingletonPropertyIdentifier"	);

export function Singleton< T extends ClassType<any> >( target: T )
{
	return class Singleton extends Metadata.PreserveMetadata( target )
	{
		private static [SingletonInstance]?: Singleton;
		
		constructor( ...args: unknown[] )
		{
			if( Singleton[SingletonInstance] !== undefined )
			{
				return Singleton[SingletonInstance];
			}
			super( ...args );
			Singleton[SingletonInstance] = this;
		}
	}
}

export function SingletonByProperty< T extends _ctor_any | ClassType<T> >( target: T ): T
{
	const prop_id = Reflect.get( target.prototype, SingletonPropertyIdentifier ) as PropertyKey | undefined;
	if ( prop_id === undefined ) throw new SyntaxError( `A property of \`${target.name}\` must be marked by the @SingletonProperty decorator` );

	const out = class SingletonByProperty extends Metadata.PreserveMetadata( target )
	{
		private static [SingletonInstance]: Map<any, SingletonByProperty> = new Map();
		constructor( ...args: unknown[] )
		{
			super( ...args );

			// Try and get existing singleton
			const prop_val = Reflect.get( this, prop_id as PropertyKey, this );
			const cur = SingletonByProperty[SingletonInstance].get( prop_val );
			if ( cur )
			{
				return cur;
			}
			else
			{
				// Update the singleton reference and allow 'this' to be returned
				SingletonByProperty[SingletonInstance].set( prop_val, this );
			}
		}
	}
	return out as unknown as T;
}
export function SingletonProperty< T extends ClassType<T> >( target: InstanceType<T>, prop: PropertyKey )
{
	Reflect.set( target, SingletonPropertyIdentifier, prop );
}