import { Database } from "../meta/database";
import { Reflection } from "../meta/reflection";
import { Serializable } from "../meta/serialize";
import type { _protected_ctor } from "./types";

@Database.Manage
@Reflection.Class<Guid>()
export class Guid {

	@Database.PrimaryKey
	public readonly value : string;

	@Database.Key()
	public get Foo()
	{
		console.log( "GUID::Foo" )
		return "NAH";
	}
	
	@Database.Key()
	public set Bar( v: string )
	{
		console.log( `GUID::Bar(${v})` );
	}

	public static From( source_guid: Guid | string )
	{
		if ( typeof source_guid === 'string' ) return new Guid( source_guid );
		return new Guid( source_guid.value );
	}

	public static Create() { return new Guid(); }

	protected constructor( guid_string : string = crypto.randomUUID() )
	{
		this.value = guid_string;
	}
	
	[Symbol.toPrimitive]()	{ return this.value; }
	toString()				{ return this.value; }
	toJSON()				{ return this.value; }
}

const g1 = Guid.Create();
g1.Bar = "Howdy";
console.log( `GUID g1:`, g1, g1.value, g1.Foo );
const g2 = Guid.Create();
const g1_refcopy = Guid.From( g1 );
const g1_strcopy = Guid.From( g1.toString() );


//let test: Guid = Database.get( Guid ).byPrimaryKey().where( g1.toString() ) as Guid;

// console.log( g1 === g1_refcopy, g1 === g1_strcopy );

// const serialized = JSON.stringify( g1, null, '\t' );
// console.log( `g1 serialized:`, serialized );
// const revived: Guid = JSON.parse( serialized ) as Guid;
// console.log( `g1 revived`, revived );