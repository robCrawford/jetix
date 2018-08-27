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

function setHook(vnode, hookName, callback) {
    // https://github.com/snabbdom/snabbdom#hooks
    // init        a vnode has been added                                vnode
    // create      a DOM element has been created based on a vnode       emptyVnode, vnode
    // insert      an element has been inserted into the DOM             vnode
    // prepatch    an element is about to be patched                     oldVnode, vnode
    // update      an element is being updated                           oldVnode, vnode
    // postpatch   an element has been patched                           oldVnode, vnode
    // destroy     an element is directly or indirectly being removed    vnode
    // remove      an element is directly being removed from the DOM     vnode, removeCallback
    vnode.data = vnode.data || {};
    vnode.data.hook = vnode.data.hook || {};
    vnode.data.hook[hookName] = callback;
}

export { patch, h, setHook };
