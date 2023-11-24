import { Serializable, type Class, defaultDataProvider } from "./Serialize";

export type UuidType = ReturnType<typeof crypto.randomUUID> | string;
export type Indexable<T> = T & { get uuid(): UuidType }

export class Index {
	
}
export class Database {
	static async put<T extends object>( data: T, uuid?: UuidType )
	{
		const dehydrated = await Serializable.Dehydrate( data );
		dehydrated.uuid = uuid ?? dehydrated.$$ref;

		const dp = Serializable.GetDataProviderFor( data );
		dp.put( dehydrated.uuid, dehydrated );
		return dehydrated.uuid;
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
