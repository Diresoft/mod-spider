import type { Point } from "./Point";

export class Rect
{
	public left		: number;
	public right	: number;
	public top		: number;
	public bottom	: number;
	public center	: Point;
	public size		: Point;
	constructor( pos : Point, size : Point )
	{
		this.left	=	pos.x;
		this.right	=	pos.x + size.x;
		this.top	=	pos.y;
		this.bottom	=	pos.y + size.y;
		this.center	=	{
			  x: pos.x + ( size.x  / 2 )
			, y: pos.y + ( size.y	/ 2 )
		};
		this.size	= {
			  x: size.x
			, y:  size.y
		};
	}

	outside( point : Point )
	{
		return point.x < this.left || point.x > this.right || point.y < this.top || point.y > this.bottom;
	}

	inside( point : Point )
	{
		return !this.outside( point );
	}
}