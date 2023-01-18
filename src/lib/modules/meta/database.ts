import type { _ctor, _protected_ctor } from '$lib/modules/util/types';
import { Design, Reflection } from './reflection';

export class Database
{
	public static Manage_ProtectedType<T extends _protected_ctor>( base_class: T): typeof base_class
	{
		return Database.Manage( base_class as unknown as _ctor ) as unknown as T; // Although this isn't type safe, the underlying JS will still work
	}

	public static Manage<T extends _ctor>( base_class: T): typeof base_class
	{
		const meta = Reflection.Reflect( base_class );
		console.log( `@Database.Manage: ${base_class.name}`, meta );
		return class extends base_class
		{
		}
	}

	public static PrimaryKey<T extends _ctor>( target: InstanceType<T>, prop_key: string | symbol )
	{
	}
}