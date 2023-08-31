import { Serializable } from "./Serialize";

export type Referable<T> = T & { uuid: string }

export abstract class Reference<T>
{
	public readonly uuid: string;
	private _internal: undefined | T;
	private _internal_promise: undefined | Promise<T>;

	/** Loads an object with the specified Unique Identifier */
	protected abstract retrieve( uuid: string ): Promise<T>;

	public get value(): undefined | T
	{
		return this._internal;
	}

	public Get(): Promise<T>
	{
		if ( this._internal !== undefined )
		{
			return Promise.resolve( this._internal );
		}
		else if ( this._internal_promise !== undefined )
		{
			return this._internal_promise;
		}
		else
		{
			this._internal_promise = this.retrieve( this.uuid ).then( (v) => {
				this._internal = v;
				return v;
			});
			return this._internal_promise
		}
	}

	constructor( uuid: string, value?: T)
	constructor( value: Referable<T> )
	constructor( uuid_or_value: string|Referable<T>, value?: T )
	{
		if ( typeof uuid_or_value === 'string' )
		{ // User constructed reference from uuid string
			this.uuid		= uuid_or_value;
			this._internal	= value;
		}
		else
		{ // User constructed reference from a value which had a uuid
			this.uuid		= uuid_or_value.uuid;
			this._internal	= uuid_or_value;
		}
	}

	public toJSON(): any
	{
		return this.uuid;
	}
}
