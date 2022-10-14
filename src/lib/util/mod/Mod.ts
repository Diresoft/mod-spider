import { Guid } from "../Guid";
import { Serializable } from "../serializable/decorators";

@Serializable
export class Mod
{
	public readonly guid : Guid = new Guid();


}