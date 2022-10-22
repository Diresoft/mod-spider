import { DoNotSerialize, Serializable } from "../metaprogramming/serialization_decorators";
import { Guid } from "../util/Guid";
import type { Constructor } from "../util/types";
import { db } from "./Database";

@Serializable
export class Reference<T extends Constructor>
{
	// -~= Properties =~-
	// - Public
	public readonly ref	: Guid		= Guid.Create();

	// - Private
	@DoNotSerialize
	private _cached		: InstanceType<T> | null	= null;

	// -~= Methods =~-
	// - Static

	// - Instance
	public async Get() : Promise<T> {
		console.log( "Get from Ref" );
		return this._cached ?? ( this._cached = ( await db.getByRef( this ) ) ); 
	}

	// - Constructor
	constructor( target : InstanceType<T> )
	{
		this._cached = target;
	}
}