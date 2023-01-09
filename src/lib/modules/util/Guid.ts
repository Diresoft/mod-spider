import { NoAutoHydrator, Serializable, TypeHydrator } from "../metaprogramming/serialization_decorators";

const constellation : Map<string, Guid> = new Map();

@Serializable
@NoAutoHydrator
export class Guid {
	protected readonly value : string | undefined;

	/** Construct a Guid object from a uuid string.
	 * If the uuid string has already been used this run, will retrieve the existing instance
	 * for that uuid so object comparison is valid
	 */
	private constructor( in_guid_string : string = crypto.randomUUID() )
	{
		if ( constellation.has( in_guid_string ) ) return constellation.get( in_guid_string ) as Guid;
		else {
			this.value = in_guid_string;
			constellation.set( in_guid_string, this );
		}
	}

	static Create() { return new Guid(); }
	static From( str: string ) { return new Guid( str ); }

	@TypeHydrator
	static _hydrator( d : string ) { // Stored in JSON as nothing more than a string
		return new Guid( d );
	}

	[Symbol.toPrimitive](){ return this.value; }
	toString(){ return this.value; }
	toJSON() { return this.value; }
}