import { createTextElement, beginCompileStep } from "./compiler";
import { format, parseUiProps } from "./utils";

const conditionals = new Set();
const events = new Set();

const createElement = (type, props = {}, ...children) => {
  const {
    conditional,
    clickEvent,
    hasTransition,
    nonUiProps,
    uiProps,
  } = parseUiProps(props ?? {});

  if (conditional) {
    conditionals.add(conditional);
  }

  if (clickEvent) {
    events.add(clickEvent);
  }

  return {
    type,
    props: {
      // props pass-through
      ...nonUiProps,

      // conditionals & events
      ...(conditional && { "x-show": conditional }),
      ...(clickEvent && { "x-on:click": clickEvent }),

      // Transition Mapping
      ...(hasTransition && {
        "x-transition:enter": uiProps["ui-transition-enter"],
        "x-transition:enter-start": uiProps["ui-transition-enter-from"],
        "x-transition:enter-end": uiProps["ui-transition-enter-to"],
        "x-transition:leave": uiProps["ui-transition-leave"],
        "x-transition:leave-start": uiProps["ui-transition-leave-from"],
        "x-transition:leave-end": uiProps["ui-transition-leave-to"],
      }),
    },
    children: children.flat().map((child) => {
      return typeof child === "object" ? child : createTextElement(child);
    }),
  };
};

const renderAlpine = (Component) => {
  return new Promise((res, rej) => {
    beginCompileStep(<Component />).then((el) => {
      // Inject x-data on parent element
      el.dom.firstChild.setAttribute(
        "x-data",
        `{ ${[...conditionals].map((c) => `${c}: false`).join(",")} }`
      );

      const template = el.dom.innerHTML;

      const html = format(template);

      conditionals.clear();
      events.clear();
      res(html);
    });
  });
};

export { renderAlpine, createElement };
