import type { Guid } from "../util/Guid";
import type { Constructor } from "../util/types";
import type { Reference } from "./Reference";


export class Database
{
	private _db : Map<Guid, unknown> = new Map();
	getByGuid<T extends Constructor>( g : Guid ) : InstanceType<T>
	{
		if ( !this._db.has( g ) ) throw new ReferenceError(`\`guid:${ g }\` not found in database`);
		return this._db.get( g ) as InstanceType<T>;
	}
}
export const db = new Database();