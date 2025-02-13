import { mount, type Component } from "svelte";
import routes from "$routes";
import "@unocss/reset/tailwind.css";
import "virtual:uno.css";
import App from "./app.svelte";
import { Router } from "./router";
import DefaultLayout from "./layout.svelte";

const target = document.querySelector("#app");
const context = new Map();
const router = new Router(routes);

context.set("router", router);
context.set("findRoute", findRoute);

async function findRoute() {
  const route = router.find(location.pathname);
  if (!route) return;

  type Result = { html: string; frontmatter: Record<any, any> };

  const result: Result = await import(
    /* @vite-ignore */ `/@fs/${route.handler}`
  );
  return result;
}

async function startApp() {
  if (!target) return;

  mount(App, {
    target,
    props: {
      markdown: await findRoute(),
      Layout: DefaultLayout,
    },
  });
}

startApp();
