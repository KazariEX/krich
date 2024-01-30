import terser from '@rollup/plugin-terser'
import {esmOutput, iifeOutput, optional} from './rollup.config.common.mjs'

const customOptional = {
    ...optional
}

// noinspection SpellCheckingInspection
customOptional.plugins.push(
    terser({
        compress: {
            sequences: true,
            unsafe: true,
            unsafe_arrows: true,
            unsafe_math: true,
            pure_getters: true,
            booleans_as_integers: true,
            drop_console: true,
            passes: 2,
            ecma: 2016
        }
    })
)

// noinspection JSUnusedGlobalSymbols
export default [{
    output: iifeOutput,
    ...customOptional
}, {
    output: esmOutput,
    ...customOptional
}]