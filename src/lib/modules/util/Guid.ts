import { Database } from "../meta/database";
import { DireReflection } from "../meta/shared";

const constellation : Map<string, Guid> = new Map();

@Database.Manage_ProtectedType
@DireReflection.Class()
export class Guid {
	protected readonly value : string;

	public static Create() { return new Guid(); }
	protected constructor( guid_string : string = crypto.randomUUID() )
	{
		this.value = guid_string; // Satisfy readonly constraint by setting this even if we'll return another instance
		if ( constellation.has( guid_string ) ) return constellation.get( guid_string ) as Guid; // Check if this GUID has already been instantiated. Guids are unique, so use that one instead.
		constellation.set( guid_string, this ); // Didn't already have this Guid, so cache it and move on
		return this;
	}
	
	[Symbol.toPrimitive]()	{ return this.value; }
	toString()				{ return this.value; }
	toJSON()				{ return this.value; }
}