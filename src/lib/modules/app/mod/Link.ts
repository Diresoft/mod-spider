import { app } from "../application_context";
import { DoNotSerialize, Serializable } from "../metaprogramming/serialization_decorators";
import { Guid } from "../../util/Guid";
import type { Mod } from "./Mod";

export enum ModLinkType {
	  Note
	, Requires
	, Recommends
	, Incompatible
}

@Serializable
export class ModLinkDescriptor<T = string> {
	public readonly type	: ModLinkType;
	public          notes	: undefined | T;
	constructor( type : ModLinkType )
	{
		this.type = type;
	}
}

@Serializable
export class ModLink<ModType extends Mod, NoteType=string>
{
	private readonly _target_guid	: Guid;
	@DoNotSerialize
	private          _target		: ModType | null = null;

	public readonly guid			: Guid = Guid.Create();
	public readonly descriptor		: ModLinkDescriptor<NoteType>;
	constructor( type : ModLinkType, target : ModType )
	{
		this.descriptor		= new ModLinkDescriptor( type );
		this._target_guid	= target.guid;
		this._target		= target;
	}

	// get ref() : ModType
	// {
	// 	// if ( this._target === null )
	// 	// {
	// 	// 	this._target = app.getLoadedPlan().getIndex("mod").get( this._target_guid );
	// 	// }
	// 	// return this._target;
	// }

	// TODO: Should a link push it's associated mod into the database when serializing?
	// TODO: Ref counting?
}