import type { DataProvider, JsonType, SerializeTyped } from "../Serialize";
import type { IncludeFunctions } from "../UtilityTypes";

export class scopedStorage implements IncludeFunctions< typeof localStorage >
{
	// STATIC API
	protected static scopedKey( scope: string, key: string): string
	{
		return `${scope}_${key}`
	}
	
	public static clear( scope: string ): void
	{
		throw new Error("Method not implemented.");
	}

	public static getItem( scope: string, key: string): string | null
	{
		console.log( `Load Scoped Item <${this.scopedKey( scope, key )}>`, scope, key );
		return localStorage.getItem( this.scopedKey( scope, key ) );
	}

	public static key( scope: string, index: number): string
	{
		throw new Error("Method not implemented.");
	}

	public static removeItem( scope: string, key: string): void
	{
		return localStorage.removeItem( this.scopedKey( scope, key ) );
	}

	public static setItem( scope: string, key: string, value: string): void
	{
		return localStorage.setItem( this.scopedKey( scope, key ), value );
	}

	public static scope( scope: string ): Readonly<scopedStorage>
	{
		return new scopedStorage( scope );
	}

	// INSTANCE WRAPPED API
	protected readonly scope: string;
	protected constructor( scope: string ){ this.scope = scope; }
	public clear      (                            ) { return scopedStorage.clear      ( this.scope             ); }
	public getItem    ( key: string                ) { return scopedStorage.getItem    ( this.scope, key        ); }
	public key        ( index: number              ) { return scopedStorage.key        ( this.scope, index      ); }
	public removeItem ( key: string                ) { return scopedStorage.removeItem ( this.scope, key        ); }
	public setItem    ( key: string, value: string ) { return scopedStorage.setItem    ( this.scope, key, value ); }
}

export class scopedStorageDataProvider implements DataProvider
{
	protected readonly scope: Readonly<scopedStorage>;

	public async has(uuid: string): Promise<boolean> {
		return this.scope.getItem( uuid ) !== null;
	}
	public async put(uuid: string, data: SerializeTyped<any>): Promise<void> {
		return this.scope.setItem( uuid, JSON.stringify( data ) );
	}
	public async get<T>(uuid: string): Promise<SerializeTyped<JsonType<T>>> {
		return JSON.parse( this.scope.getItem( uuid ) );
	}
	
	constructor( scope: string )
	{
		this.scope = scopedStorage.scope( scope );
	}
}