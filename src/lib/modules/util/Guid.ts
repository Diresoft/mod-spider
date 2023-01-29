import { Database } from "../meta/database";
import { Reflection } from "../meta/reflection";
import { Serialize } from "../meta/serialize";
import type { _protected_ctor } from "./types";

@Database.Manage
@Reflection.StubConstructor( () => Guid.Create() )
export class Guid {

	@Database.PrimaryKey
	public readonly value : string;

	public static From( source_guid: Guid | string )
	{
		// TODO: Validate the input is actually a guid if it's a string
		if ( typeof source_guid === 'string' ) return new Guid( source_guid );
		return new Guid( source_guid.value );
	}

	public static Create() { return new Guid(); }

	// Protect the constructor so arbitrary strings can't be used to instantiate
	protected constructor( guid_string : string = crypto.randomUUID() )
	{
		this.value = guid_string;
	}
	
	[Symbol.toPrimitive]()	{ return this.value; }
	toString()				{ return this.value; }
	toJSON()				{ return this.value; }
}

const g1 = Guid.Create()
const serialized = Serialize.toJSON( g1, true );
console.log( `g1 as Json:\n${ serialized }` );
const parsed: Guid = Serialize.fromJSON( serialized );
console.log( `g1 parsed:`, parsed, g1 === parsed );