<script lang="ts">
    import { SpinnerState, type SpinnerHandle } from "$lib/svelte/helpers/SpinnerHandle";
    import { fade } from "svelte/transition";

    // PROPS
    export let handle: SpinnerHandle | undefined = undefined;

    $: transition_time = 150; //handle.end_delay_ms * 0.1;
</script>

<div>
    {#if $handle?.state === SpinnerState.Running}
        <spinner transition:fade={{duration: transition_time}} />
    {:else if $handle?.state === SpinnerState.CrossVisible}
        <container class="failed" transition:fade={{duration: transition_time, delay: transition_time * 0.5}}>
            <IconCarbonCloseFilled />
        </container>
    {:else if $handle?.state === SpinnerState.CheckmarkVisible}
        <container transition:fade={{duration: transition_time, delay: transition_time * 0.5}}>
            <IconCarbonCheckmarkFilled />
        </container>
    {:else if $handle === undefined}
        <spinner transition:fade={{duration: transition_time}} />
    {/if}
</div>

<style lang="scss">
    @use 'sass:color' as color;

    $light: rgb(196, 159, 159);
    $mid_1: rgb(155, 90, 155);
    $mid_2: rgb(72, 136, 136);
    $dark:  rgb(28, 64, 44);

    @keyframes rotate {
        0%   {
            transform: translate( 25%, -25% ) rotate(0);
        }
        50% {
            transform: translate( -25%, 25% ) rotate(180deg);
        }
        100% {
            transform: translate( 25%, -25% ) rotate(360deg);
        }
    }
    div {
        display: inline-block;
        position: relative;
        height:       1em;
        aspect-ratio: 1/1;

        spinner {
            position: absolute;
            overflow: hidden;
            $padding: 0.05em;
            top:    $padding;
            left:   $padding;
            right:  $padding;
            bottom: $padding;

            //border: solid 1px #EEE;
            border-radius: 100%;
            box-shadow: 0 0 15px 5px rgba( 0, 0, 0, 0.25 );
        
            &::after,
            &::before {
                content: '';
                position: absolute;
                display:  block;
                top:    -100%;
                left:   -100%;
                right:  -100%;
                bottom: -100%;
            }

            &::before {
                background: linear-gradient(to right, rgba( $light, 0.5 ), rgba( $mid_1, 0.5 ), rgba( $dark, 0.5 ));
                animation: rotate 1.25s linear infinite;
            }
            &::after {
                //box-shadow: 0 0 5px 0 black inset;
                background: linear-gradient(to right, rgba( $light, 0.5 ), rgba( $mid_2, 0.5 ), rgba( $dark, 0.5 ));
                animation: rotate 2s linear infinite reverse;
            }
        }

        container {
            position: absolute;
            top:    0;
            left:   0;
            right:  0;
            bottom: 0;

            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;

            $col: rgb(49, 172, 55);
            color: $col;
            filter: drop-shadow( 0 0 5px rgba($col, 0.5) );
            & > :global( svg ) {
                stroke: color.scale( $col, $lightness: 65% );
                stroke-width: 0.5px;
            }
            &.failed {
                $col: rgb(255, 56, 56);
                color: $col;
                filter: drop-shadow( 0 0 5px rgba($col, 0.5) );
                & > :global( svg ) {
                    stroke: color.scale( $col, $lightness: 65% );
                    stroke-width: 0.5px;
                }
            }
        }
    }
</style>