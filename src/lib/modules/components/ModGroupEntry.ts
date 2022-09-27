import type { Writable } from "svelte/store";
import type { ModGroup } from "../app/application_context";

export enum SubgroupDragState {
	NotStarted,
	Started,
	Inside,
	Outside,
	Invalid
}

export class Dropzone
{
	public readonly element: HTMLElement;
	constructor( target: HTMLElement )
	{
		this.element = target;
	}

}

export class DragHandler
{
	public readonly payload: unknown;
	constructor( payload: unknown )
	{
		this.payload = payload;
	}
}
