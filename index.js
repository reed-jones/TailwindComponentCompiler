import Koa from "koa";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve, join } from "path";
import bodyParser from "koa-bodyparser";
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
app.use(bodyParser());

app.use(async (ctx) => {
  if (!ctx.request.body.type && !ctx.request.body.code) {
    ctx.status = 200;
    ctx.body = "Hi :) You where probably looking for this...";
    return;
  }

  const now = new Date().getTime();
  const type = ctx.request.body.type;
  // Should probably be a content-based hash instead of a timestamp
  // Could also store/cache the examples and not generate+delete every time
  const fileName = `./tmp/${type}-${now}.js`;
  try {
    // generate file to import
    if (type === "vue") {
      writeVueFile(decodeURIComponent(ctx.request.body.code), fileName);
    } else if (type === "alpine") {
      writeAlpineFile(decodeURIComponent(ctx.request.body.code), fileName);
    }

    const { Component } = await import(fileName);
    unlinkSync(fileName);
    ctx.type = "js";
    ctx.body = Component.toString();
    return;
  } catch (err) {
    if (existsSync(fileName)) {
      unlinkSync(fileName);
    }

    ctx.status = 500;
    ctx.body = "Uh oh... That didn't seam to work";
    return;
  }
});

app.listen(3000, () => {
  console.log("Listening on localhost:3000");
});
