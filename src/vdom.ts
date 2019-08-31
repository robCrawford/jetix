/*
A wrapper around `https://github.com/snabbdom/snabbdom`
with html functions from `https://github.com/ohanhi/hyperscript-helpers`
*/
import { init, h } from "snabbdom";
import sClass from "snabbdom/modules/class";
import sAttr from "snabbdom/modules/attributes";
import sProps from "snabbdom/modules/props";
import sEvents from "snabbdom/modules/eventlisteners";
import hyperscriptHelpers from 'hyperscript-helpers';
import { VNode } from "snabbdom/vnode";
export { VNode };

export const patch = init([ sClass, sAttr, sProps, sEvents ]);

export const html = hyperscriptHelpers(h);

export function setHook(vnode: VNode, hookName: string, callback: () => void): void {
  // https://github.com/snabbdom/snabbdom#hooks
  // init        a vnode has been added                                vnode
  // create      a DOM element has been created based on a vnode       emptyVnode, vnode
  // insert      an element has been inserted into the DOM             vnode
  // prepatch    an element is about to be patched                     oldVnode, vnode
  // update      an element is being updated                           oldVnode, vnode
  // postpatch   an element has been patched                           oldVnode, vnode
  // destroy     an element is directly or indirectly being removed    vnode
  // remove      an element is directly being removed from the DOM     vnode, removeCallback
  if (vnode) {
    vnode.data = vnode.data || {};
    vnode.data.hook = vnode.data.hook || {};
    vnode.data.hook[hookName] = callback;
  }
}
