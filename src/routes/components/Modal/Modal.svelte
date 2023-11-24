<script lang="ts" context="module">
    import type { ComponentType, SvelteComponent } from "svelte";
    import { writable, type Writable } from "svelte/store";
    import { fade, fly } from "svelte/transition";

    export interface ModalInterface<ResultType = any> {
        dismiss: ( v?: ResultType ) => void
    }
    export type ModalComponent = ComponentType<SvelteComponent<ModalInterface>>
           type ModalComponentResultType<T> = T extends ComponentType<SvelteComponent<ModalInterface<infer R>>> ? R : never;
    
    type ModalStackEntry<T extends ModalInterface = ModalInterface> = {
        component: ModalComponent;
        dismiss:   T['dismiss'];
    }

    let modal_stack: Writable< ModalStackEntry[] > = writable( [] );
    export function pushModal<T extends ModalComponent>( modal_component: T ): Promise<ModalComponentResultType<T>> {
        type RT = ModalComponentResultType<T>;
        let r: ( args: RT ) => void;
        const p = new Promise<RT>( res => r = res );

        modal_stack.update( s => {
            const idx = s.push({
                component: modal_component,
                dismiss: ( args: RT ) => {
                    modal_stack.update( s => {
                        s.splice( idx - 1, 1 );
                        return s;
                    });
                    r( args );
                }
            });
            return s;
        });
        
        return p;
    }
</script>
<script lang='ts'>
    $: top_modal = $modal_stack[0];
</script>

{#if top_modal !== undefined}
<div transition:fade={{duration: 250}}>
    <span transition:fly={{y: -25, duration: 450, delay: 125}}>
        <svelte:component this={top_modal.component} dismiss={top_modal.dismiss}/>
    </span>
</div>
{/if}

<style lang="scss">
    @use 'sass:color';
    @use '$scss/theme';
    div {

        position: fixed;
        z-index:  999;
        top:    0;
        left:   0;
        right:  0;
        bottom: 0;

        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;

        background-color: rgba( 50, 50, 50, 0.15 );
        backdrop-filter: blur( 1.5px );

        span {
            display:        flex;
            flex-direction: column;
            align-items:    stretch;

            border-radius: 1.5em;
            overflow: hidden;

            $offset: 2em;
            $spread: 8em;
            box-shadow:
                (-$offset) (-$offset) $spread rgba( theme.$accent_1, 0.25 ),
                  $offset    $offset  $spread rgba( theme.$accent_2, 0.25 ),
                0 0 0.5em 0.1em rgba( black, 0.75 )
            ;

            & :global( > * ) {
                flex-grow: 1;
            }
        }
    }
</style>