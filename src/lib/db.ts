import { Serializable, type Class, defaultDataProvider } from "./Serialize";

export type UuidType = ReturnType<typeof crypto.randomUUID> | string;
export type Indexable<T> = T & { get uuid(): UuidType }

export class Database {
	static async put<T extends object>( data: T ): Promise<UuidType>
	{
		const dehydrated = await Serializable.Dehydrate( data );
		const uuid = dehydrated.$$ref;

		const dp = Serializable.GetDataProviderFor( data );
		dp.put( uuid, dehydrated );
		return uuid;
	}
	static async get<T extends object>( uuid: UuidType ): Promise<T>
	{
		return await Serializable.Hydrate( uuid );
	}
	static async delete( uuid: UuidType, prototype?: object )
	{
		let dp = defaultDataProvider;
		if ( prototype !== undefined ) dp = Serializable.GetDataProviderFor( dp );

		return dp.delete( uuid );
	}
	static async has( uuid: UuidType, prototype?: object ): Promise<boolean>
	{
		let dp = defaultDataProvider;
		if ( prototype !== undefined ) dp = Serializable.GetDataProviderFor( dp );

		return dp.has( uuid );
	}
}