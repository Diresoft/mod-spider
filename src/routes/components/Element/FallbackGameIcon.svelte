<script lang="ts">
    export let title: string = "";
</script>

<div>
    <IconCarbonGameConsole />
    <small>{title}</small>
</div>

<style lang="scss">
    @use 'sass:color';
    @use '$scss/theme';

    div {
        position: relative;

        $dark:      color.mix( theme.$dark,  theme.$accent_1, 75% );
        $light:     color.mix( theme.$light, theme.$accent_1, 75% );
        background: linear-gradient( 45deg, $dark, theme.$accent_1, $light );
        
        display:         flex;
        flex-direction:  column;
        align-items:     center;
        justify-content: center;

        text-align: center;

        height:  100%;
        padding: 10%;

        & > :global( svg ) {
            font-size: 3em;
            flex-basis: 75%;
        }
        small {
            font-size:   0.75em;
            font-weight: bold;
            flex-basis:  25%;

            white-space: pre-wrap;
        }
    }
</style>