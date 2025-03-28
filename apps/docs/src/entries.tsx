/* this file is automatically generated by garbanzo */
/* DO NOT MANUALLY EDIT THIS FILE */

import { createPages } from "waku";
import type { PathsForPages } from "waku/router";

import layout0 from "./app/@layout";
import root1 from "./app/@root";
import route2 from "./app/api/greet/route";
import page3 from "./app/page";

let pages = createPages(async ({ createPage, createLayout, createRoot, createApi }) => [
createLayout({
  render: "dynamic",
  path: "/",
  component: layout0,
}),
createRoot({
  render: "dynamic",
  component: root1,
}),
createApi({
  render: "dynamic",
  path: "/api/greet",
  handlers: {
    GET: route2,
    POST: route2,
    PUT: route2,
    DELETE: route2,
    PATCH: route2,
    OPTIONS: route2,
    HEAD: route2,
    TRACE: route2,
    CONNECT: route2,
  },
}),
createPage({
  render: "dynamic",
  path: "/",
  component: page3,
}),
]);

declare module "waku/router" {
  interface RouteConfig {
    paths: PathsForPages<typeof pages>;
  }
  interface CreatePagesConfig {
    pages: typeof pages;
  }
}

export default pages;