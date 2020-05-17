import { createTextElement, beginCompileStep } from "./compiler";
import {
  format,
  writeVueScriptsTag,
  wrapWithTemplate,
  parseUiProps,
} from "./utils";

const conditionals = new Set();
const events = new Set();

const createElement = (type, props, ...children) => {
  const {
    conditional,
    clickEvent,
    hasTransition,
    nonUiProps,
    uiProps,
    nonTransitionProps,
  } = parseUiProps(props ?? {});

  if (conditional) {
    conditionals.add(conditional);
  }

  if (clickEvent) {
    events.add(clickEvent);
  }

  if (!hasTransition) {
    return {
      type,
      props: {
        // props pass-through
        ...nonUiProps,

        // conditionals & events
        ...(conditional && { "v-if": conditional }),
        ...(clickEvent && { "v-on:click": clickEvent }),
      },
      children: children.flat().map((child) => {
        return typeof child === "object" ? child : createTextElement(child);
      }),
    };
  }

  // Creates a configured vue 'transition' element
  return createElement(
    "transition",
    {
      // Transition Mapping
      "enter-active-class": uiProps["ui-transition-enter"],
      "enter-class": uiProps["ui-transition-enter-from"],
      "enter-to-class": uiProps["ui-transition-enter-to"],
      "leave-active-class": uiProps["ui-transition-leave"],
      "leave-class": uiProps["ui-transition-leave-from"],
      "leave-to-class": uiProps["ui-transition-leave-to"],
    },
    // forward all non transition props to the expected child (on click, class etc)
    ...[createElement(type, nonTransitionProps, ...children)]
  );
};

const renderVue = (Component) => {
  return new Promise((res, rej) => {
    beginCompileStep(<Component />).then((el) => {
      const template = wrapWithTemplate(el.dom.innerHTML);

      let html = format(template);

      if (conditionals.size) {
        html += writeVueScriptsTag(conditionals);
      }
      conditionals.clear();
      events.clear();
      res(html);
    });
  });
};

export { renderVue, createElement };
