import { Database } from "../meta/database";
import { Reflection } from "../meta/reflection";
import { Serializable } from "../meta/serialize";

//@Database.Manage
@Reflection.Class<Guid>()
export class Guid {

	//@Database.Key()
	protected readonly value : string;

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
console.log( `Test`, Reflection.Get( g1 ) )

// const g1 = Guid.Create();
// const g2 = Guid.Create();
// const g1_refcopy = Guid.From( g1 );
// const g1_strcopy = Guid.From( g1.toString() );


// //let test: Guid = Database.Get( Guid ).getByPrimaryKey( g1.toString() );

// console.log( g1 === g1_refcopy, g1 === g1_strcopy );

// const serialized = JSON.stringify( g1, null, '\t' );
// console.log( `g1 serialized:`, serialized );
// const revived: Guid = JSON.parse( serialized ) as Guid;
// console.log( `g1 revived`, revived );