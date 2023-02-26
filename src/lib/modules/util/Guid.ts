import { Serializable } from "../meta/serializable";
import { SingletonByProperty, SingletonProperty } from "../meta/singleton";

@Serializable( ( guid_string: string ) => Guid.From( guid_string ) )
@SingletonByProperty
export class Guid {

	@SingletonProperty
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
		//console.log( `Guid construct from: ${guid_string}`)
		this.value = guid_string;
	}
	
	[Symbol.toPrimitive]()	{ return this.value; }
	toString()				{ return this.value; }
	toJSON()				{ return this.value; }
}