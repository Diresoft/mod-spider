<script lang='ts'>
	import '@scss/base.scss';
	
	// Force these types to be processed so they're in the serialization reverse lookup
	import { GenericWebMod } from "@lib/adapter/GenericWebMod";
	import { NxmMod } from "@lib/adapter/Nexusmods";
</script>
<slot />