import Koa from "koa";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve, join } from "path";
import cors from "@koa/cors";

// import { Sample as SampleAlpine } from "./src/SampleComponentAlpine.js";
// import { Sample as SampleVue } from "./src/SampleComponentVue.js";
// import { renderAlpine } from "./src/compileToAlpine";
// import { renderVue } from "./src/compileToVue.js";

/**
 * Write to a
 */
const writeVueFile = (code, fileName) =>
  writeFileSync(
    fileName,
    `import { render, createElement } from "../src/compileToVue"
export const Component = ({ props }) => {
    return (${code})
};`
  );

const writeAlpineFile = (code, fileName) =>
  writeFileSync(
    fileName,
    `import { render, createElement } from "../src/compileToAlpine"
export const Component = ({ props }) => {
    return (${code})
};
`
  );

const app = new Koa();
app.use(cors());

app.use(async (ctx) => {
  const now = new Date().getTime();
  const type = ctx.request.query.type;
  // Should probably be a content-based hash instead of a timestamp
  // Could also store/cache the examples and not generate+delete every time
  const fileName = `./tmp/${type}-${now}.js`;
  try {
    // generate file to import
    if (type === "vue") {
      writeVueFile(decodeURIComponent(ctx.request.query.code), fileName);
    } else if (type === "alpine") {
      writeAlpineFile(decodeURIComponent(ctx.request.query.code), fileName);
    }

    const { Component } = await import(fileName);
    unlinkSync(fileName);
    ctx.body = Component.toString();
  } catch (err) {
    if (existsSync(fileName)) {
      unlinkSync(fileName);
    }
  }
});

app.listen(3000);
