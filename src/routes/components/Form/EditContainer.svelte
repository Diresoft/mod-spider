<button on:click>
    <slot />
    <small><IconCarbonEdit /></small>
</button>

<style lang="scss">
    @use "$scss/theme";
    button {
        position:   relative;
        background: none;
        outline:    none;
        border:     none;

        cursor:     pointer;

        small {
            position: absolute;

            top:    0;
            left:   0;
            right:  0;
            bottom: 0;

            backdrop-filter: blur( 3px ) brightness( 75% );

            color:     theme.$light;
            font-size: 200%;

            filter: drop-shadow( 0px 0px 10px theme.$light );

            & > :global( svg ) {
                position:  absolute;
                transform: translate( -50%, -50% );
                left: 50%;
                top:  50%;
            }

            opacity: 0;
            transition: opacity 300ms ease;
        }

        &:hover small {
            opacity: 1;
        }
    }
</style>