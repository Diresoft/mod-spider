import type { Constructor } from "../util/types";
import { Reflection } from "./reflection";

export namespace Database
{
	export function Manage<T extends object>( target: Constructor<T> ): any
	{
		const asClass = target as abstract new (...args: any[])=>T;
		const Managed = class extends asClass {

		}

		//return Managed;
	}

	export function Key<T extends object>( key_name?: string|symbol )
	{
		return function ( target: T, prop: string|symbol )
		{
			const meta = Reflection.Get( target );
			console.log( target, meta );
		}
	}
}