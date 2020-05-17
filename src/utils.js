import prettier from "prettier/standalone"
import parserBabel from "prettier/parser-babel"

export function format(code) {
  const formatted = prettier.format(code, {
    parser: "babel",
    printWidth: 80,
    jsxBracketSameLine: true,
    plugins: [parserBabel],
  })

  // Babel parser puts a `;` at the end
  return formatted.trim().replace(/;$/, "")
}

export function wrapWithTemplate(code) {
  return `<template>${code}</template>`
}

export function writeVueScriptsTag(conditionals) {
  return `

<script>
export default {
    data() {
        return {
            ${[...conditionals].map((c) => `${c}: false`).join(",")}
        }
    }
}
</script>`
}

export function parseUiProps(props) {
  return {
    // show/hide conditions
    conditional: props["ui-if"],

    // click events
    clickEvent: props["ui-on-click"],

    // does the element have an transitions?
    hasTransition:
      Object.keys(props).filter((key) => key.includes("ui-transition")).length >
      0,

    // standard html props
    nonUiProps: Object.fromEntries(
      Object.entries(props).filter(([key]) => !key.startsWith("ui-"))
    ),

    // tailwind-ui-event/data props
    uiProps: Object.fromEntries(
      Object.entries(props).filter(([key]) => key.startsWith("ui-"))
    ),

    // non tailwind-ui-transition props
    nonTransitionProps: Object.fromEntries(
      Object.entries(props).filter(([key]) => !key.startsWith("ui-transition"))
    ),
  }
}
