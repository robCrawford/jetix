/*
  A wrapper around `https://github.com/snabbdom/snabbdom`
*/
const snabbdom = require("snabbdom");
const patch = snabbdom.init([
    require("snabbdom/modules/class").default,
    require("snabbdom/modules/props").default,
    require("snabbdom/modules/eventlisteners").default
]);
const h = require("snabbdom/h").default;

export { patch, h };
