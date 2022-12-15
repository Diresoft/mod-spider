import type { Point } from "./Point";

export class Vector2D implements Point
{
	public x : number;
	public y : number;

	constructor( x : number = 0, y : number = 0)
	{
		this.x = x;
		this.y = y;
	}

	get length_sqr()
	{
		return (this.x * this.x) + (this.y * this.y);
	}
	get length()
	{
		return Math.sqrt( this.length_sqr );
	}
};
