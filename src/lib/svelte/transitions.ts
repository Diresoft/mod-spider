import { cubicInOut } from "svelte/easing";

export type BlurOptions = {
    delay             ?: number;
    duration          ?: number;
    easing            ?: ( t: number )=> number;
    amount            ?: number;
    opacity           ?: number;
    bAbsolutePosition ?: boolean;
}
export function blurExtra( node: Element, options: BlurOptions )
{
	const style = getComputedStyle(node);
	const target_opacity = +style.opacity;
	const f = style.filter === 'none' ? '' : style.filter;
	const od = target_opacity * (1 - (options.opacity ?? 0));
	//const [value, unit] = split_css_unit(amount);
	return {
		delay:    options.delay    ?? 0,
		duration: options.duration ?? 400,
		easing:   options.easing   ?? cubicInOut,
		css: (_t: number, u: number) => `opacity: ${target_opacity - od * u}; filter: ${f} blur(${u * (options.amount ?? 10)}px); position: absolute;`
	};
}


export type TranslateSlideOptions = {
	
}