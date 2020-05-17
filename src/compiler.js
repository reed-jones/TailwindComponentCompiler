import { JSDOM } from "jsdom";

const dom = new JSDOM(
  `<!DOCTYPE html><head></head><body><div id="app"></div></body>`,
  { pretendToBeVisual: true }
);
const document = dom.window.document;

const CUSTOM_TYPES = {
  TEXT_ELEMENT: "TEXT_ELEMENT",
};

export const createDom = (fiber) => {
  const dom =
    fiber.type === CUSTOM_TYPES.TEXT_ELEMENT
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, fiber.props);

  return dom;
};

export const createTextElement = (text) => {
  return {
    type: CUSTOM_TYPES.TEXT_ELEMENT,
    props: {
      nodeValue: text,
    },
    children: [],
  };
};

export const updateFunctionComponent = (fiber) => {
  const details = {
    props: fiber.props,
    children: fiber.children,
  };

  const children = [fiber.type(details)];
  reconcileChildren(fiber, children);
};

export const updateHostComponent = (fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.children);
};

const reconcileChildren = (wipFiber, elements) => {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type == oldFiber.type;

    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        children: element.children,
        dom: null,
        parent: wipFiber,
        alternate: null,
      };
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
};

const updateDom = (dom, nextProps) => {
  // Set new or changed properties
  Object.keys(nextProps).forEach((name) => {
    if (dom.setAttribute) {
      dom.setAttribute(name, nextProps[name]);
    } else {
      dom[name] = nextProps[name];
    }
  });
};

export const beginCompileStep = (element) => {
  let currentRoot = null;
  let promise = null;
  let retPromise = new Promise((resolve, reject) => {
    promise = { resolve, reject };
  });
  let wipRoot = {
    // start off with a blank div not actually in the dom
    // use this to render the tree & print out the reconfigured
    // html/js/whatever
    dom: document.createElement("div"),
    props: {},
    children: [element],
    alternate: currentRoot,
  };

  let nextUnitOfWork = wipRoot;

  const commitRoot = () => {
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null;
  };

  const commitWork = (fiber) => {
    if (!fiber) {
      return;
    }

    let domParentFiber = fiber.parent;
    while (!domParentFiber.dom) {
      domParentFiber = domParentFiber.parent;
    }
    const domParent = domParentFiber.dom;

    if (fiber.dom != null) {
      domParent.appendChild(fiber.dom);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
  };

  // Game Loop
  const workLoop = (deadline = null) => {
    let shouldYield = false;

    while (nextUnitOfWork && !shouldYield) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      // shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextUnitOfWork && wipRoot) {
      promise.resolve(wipRoot);
      commitRoot();
    }
  };

  dom.window.requestAnimationFrame(workLoop);

  const performUnitOfWork = (fiber) => {
    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
      updateFunctionComponent(fiber);
    } else {
      updateHostComponent(fiber);
    }

    if (fiber.child) {
      return fiber.child;
    }
    let nextFiber = fiber;
    while (nextFiber) {
      if (nextFiber.sibling) {
        return nextFiber.sibling;
      }
      nextFiber = nextFiber.parent;
    }
  };

  return retPromise;
};
