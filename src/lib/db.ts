import { Serializable, type Class } from "./Serialize";

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
	static async get<T extends object>( uuid: UuidType, type: Class<T> ): Promise<T>
	{
		return await Serializable.Hydrate( { $$ref: uuid, $$type: type.name } );
	}
}