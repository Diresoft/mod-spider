import type { _ctor, _private_ctor, _protected_ctor } from "../util/types";
import { Reflection } from "./reflection";

export class Serializable
{
	public static Manage_ProtectedType<T extends _protected_ctor>( base_class: T)
	{
		return Serializable.Manage( base_class as unknown as _ctor ) as unknown as T; // Although this isn't type safe, the underlying JS will still work
	}

	public static Manage<T extends _ctor>( base_class: T): typeof base_class
	{
		const meta = Reflection.Get( base_class );
		console.log( `@Serializable.Manage`, base_class, meta );
		return class extends base_class
		{
		}
	}

	public static PrimaryKey<T extends _ctor>( target: InstanceType<T>, prop_key: string | symbol )
	{
	}
}