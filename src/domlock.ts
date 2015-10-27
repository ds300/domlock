/// <reference path="../node_modules/derivable/dist/derivable.d.ts"/>
/// <reference path="../node_modules/immutable/dist/immutable.d.ts"/>

import { Atom, Derivable, Reaction } from 'derivable'
import * as _ from 'derivable'
import { List, Map, OrderedSet } from 'immutable'
import { renderClass } from './util'

export class VDOM {
  tagName: string;
  props: any;
  children: any[];
  constructor (tagName: string, props: any, children: any[]) {
    this.tagName = tagName;
    this.props = props;
    this.children = children;
  }
  equals (other) {
    return other === this;
  }
}

/**
 * Creates a VDOM node from the given spec. jsx pluggable
 */
export function dom(tagName: string, props: any, ...children: any[]): VDOM {
  if (typeof tagName !== 'string') {
    throw new Error("domlock only supports regular html tags.");
  }
  return new VDOM(tagName, props || {}, children);
}


export type Renderable = VDOM | List<any> | string | Array<any> | Derivable<any>;

/**
 * Renders a renderable thing, apending it to parent
 */
export function render (thing: Renderable, parent: HTMLElement) {
  if (thing instanceof VDOM) {
    renderVDOM(thing, parent);
  } else if (_.isDerivable(thing)){
    renderDerivable(<Derivable<any>>thing, parent);
  } else {
    renderString(<string>thing, parent);
  }
}

const TMP_NODE = document.createElement('div');

/**
 * coerces a thing to a DOM Node. doesn't work for derivables or lists/arrays,
 * otherwise calls .toString on the thing. Leaves things that are already Nodes
 * alone.
 */
export function toNode(thing: any): Node {
  if (thing instanceof Array || thing instanceof List || _.isDerivable(thing)) {
    throw new Error("can't coerce arrays, lists, or derivables to nodes");
  } else if (thing instanceof Node) {
    return thing;
  } else {
    render(thing, TMP_NODE);
    let rendered = TMP_NODE.lastChild;
    while (TMP_NODE.lastChild) {
      TMP_NODE.removeChild(TMP_NODE.lastChild);
    }
    return rendered;
  }
}

const IN_DOM = '__domlock__elemInDom';
const PARENT = '__domlock__elemParent';

function ensureParentState(parent: HTMLElement) {
  if (!parent[IN_DOM]) {
    parent[IN_DOM] = _.atom(document.body.contains(parent));
  }
}

function ensureChildState(child: Node) {
  if (!child[PARENT]) {
    child[PARENT] = _.atom(null);
    child[IN_DOM] = child[PARENT].derive(p => p && p[IN_DOM].get())
  }
}

/**
 * Like Node#appendChild but with domlock bookkeeping
 */
export function appendChild(parent: HTMLElement, child: Node) {
  ensureParentState(parent);
  ensureChildState(child);
  child[PARENT].set(parent);
  parent.appendChild(child);
}

/**
 * Like Node#replaceChild but with domlock bookkeeping
 */
export function replaceChild(parent: HTMLElement, newChild: Node, oldChild: Node) {
  ensureParentState(parent);
  ensureChildState(newChild);
  newChild[PARENT].set(parent);
  oldChild[PARENT] && oldChild[PARENT].set(null);
  parent.replaceChild(newChild, oldChild);
}

/**
 * Like Node#insertBefore but with domlock bookkeeping
 */
export function insertBefore(parent: HTMLElement, newChild: Node, referenceChild: Node) {
  ensureParentState(parent);
  ensureChildState(newChild);
  newChild[PARENT].set(parent);
  parent.insertBefore(newChild, referenceChild);
}

/**
 * Like Node#remove but with domlock bookkeeping
 */
export function remove(parent, child) {
  child[PARENT] && child[PARENT].set(null);
  child.remove();
}

/**
 * adds lifecycle callbacks to child. invokes onMount if child is already in
 * the dom
 */
export function lifecycle(child: Node, reaction: Reaction<any>);
export function lifecycle(child: Node, onMount: () => void, onUnmount: () => void);
export function lifecycle(child: Node, onMount, onUnmount?) {
  ensureChildState(child);
  let r: Reaction<any>;
  if (_.isReaction(onMount)) {
    r = child[IN_DOM].reaction(inDom => {
      if (inDom) {
        onMount.start().force();
      } else {
        onMount.stop();
      }
    }).start();
  } else {
    r = child[IN_DOM].reaction(inDom => {
      if (inDom) {
        onMount && onMount();
      } else {
        onUnmount && onUnmount();
      }
    }).start();
  }

  if (child[IN_DOM].get()) {
    r.force();
  }
}

/**
 * partially applies f to args for the sake of mixins
 * e.g. let myLifecycle = asMixin(lifecycle, onMount, onUnmount);
 * myLifecycle(someElem); // sets up the lifecycle on someElem
 */
export function asMixin(f: (n: Node, ...args: any[]) => void, ...args: any[]): (n: Node) => void {
  return node => f.apply([node].concat(args));
}

function renderVDOM(node: VDOM, parent: HTMLElement) {
  const elem = document.createElement(node.tagName);

  appendChild(parent, elem);

  for (let key of Object.keys(node.props)) {
    let val = node.props[key];
    if (_.isDerivable(val)) {
      ((key, val) => {
        lifecycle(elem, val.reaction(v => elem[key] = v));
      })(key, val);
    } else {
      elem[key] = val;
    }
  }

  for (let child of node.children) {
    render(child, elem);
  }

  if (node.props.$node) {
    node.props.$node.set(elem);
  }

  if (node.props.$mixins) {
    node.props.$mixins.forEach(m => m(elem));
  }

  if ('$hide' in node.props) {
    if (_.isDerivable(node.props.$hide)) {
      node.props.$show = node.props.$hide.not();
    } else {
      node.props.$show = !node.props.$hide;
    }
  }

  if ('$show' in node.props) {
    if (_.isDerivable(node.props.$show)) {
      lifecycle(elem, node.props.$show.reaction(show => {
        if (show) {
          elem.style.display = "";
        } else {
          elem.style.display = "none";
        }
      }));
    } else if (!node.props.$show) {
      elem.style.display = "none";
    }
  }

  if (node.props.$style) {
    let styles = Object.keys(node.props.$style);
    for (let style of styles) {
      let val = node.props.$style[style];
      if (_.isDerivable(val)) {
        ((style, val) => {
          lifecycle(elem, val.reaction(v => elem.style[style] = v));
        })(style, val);
      } else {
        elem.style[style] = val;
      }
    }
  }

  if (node.props.$class) {
    if (!_.isDerivable(node.props.$class)) {
      node.props.$class = _.struct([node.props.$class]);
    }
    lifecycle(elem, node.props.$class.derive(renderClass).reaction(className => {
      elem.className = className;
    }));
  }
}

function renderString(str: string, parent: HTMLElement) {
  parent.appendChild(document.createTextNode(str));
}

function _walk (f: (a: any) => any, thing: any): void {
  if (thing instanceof List || thing instanceof Array) {
    thing.forEach(x => _walk(f, x));
  } else {
    f(thing);
  }
}

function walk (thing: any[], f: (a: any) => any): void {
  _walk(f, thing);
}

interface DerivableHandler {
  init(parent: HTMLElement, placeholder: Node);
  expire(parent: HTMLElement, placeholder: Node);
  willHandle(value: any): boolean;
  handle(parent: HTMLElement, value: any);
}

class TextHandler implements DerivableHandler {
  node: Text;
  init(parent, placeholder) {
    this.node = <Text>placeholder;
  }
  expire(parent, placeholder) {
    if (this.node) {
      replaceChild(parent, placeholder, this.node);
    }
  }
  willHandle(value) {
    return value &&
     !(value instanceof VDOM) &&
     !(value instanceof List) &&
     !(value instanceof Array) &&
     !(value instanceof Node) &&
     typeof value.toString === 'function';
  }
  handle(parent, value) {
    let newNode = document.createTextNode(value.toString());
    replaceChild(parent, newNode, this.node);
    this.node = newNode;
  }
}

const BLAH = {};

import { longestCommonSubsequence } from './util'

class ListHandler implements DerivableHandler {
  // the nodes currently attached to the parent
  nodes: OrderedSet<Node>;
  value2Nodes: Map<any, Node[]>;
  // a copy of the array
  id2idxs: Map<any, number[]>;

  init(parent, placeholder) {
    this.nodes = OrderedSet([placeholder]);
    this.value2Nodes = Map<any, Node[]>();
  }
  expire(parent, placeholder) {
    this.nodes.slice(1).forEach(remove);
    replaceChild(parent, placeholder, <any>this.nodes.first());
  }
  willHandle(value) {
    return (value instanceof List && value.size > 0) || (value instanceof Array && value.length > 0);
  }
  handle(parent, value) {
    // build new state, transferring nodes from previous state if possible
    let newNodes = OrderedSet<Node>().asMutable();
    let newValue2Nodes = Map<any, Node[]>().asMutable();
    let sharedDesiredOrder = OrderedSet<Node>().asMutable();

    walk(value, thing => {
      // look for previous nodes which were rendered for this thing
      let nodes = this.value2Nodes.get(thing);
      let node: Node = null;
      if (nodes && nodes.length > 0) {
        node = nodes.shift();
        sharedDesiredOrder.add(node);
      } else {
        // no previous nodes, render this thing
        // todo: doesn't work for derivables. figure out if possible
        node = toNode(thing);
      }
      newNodes.add(<any>node);
      let newNodesForThing = newValue2Nodes.get(thing);
      if (newNodesForThing == null) {
        newNodesForThing = [];
        newValue2Nodes.set(thing, newNodesForThing);
      }
      newNodesForThing.push(node);
    });

    // so we don't lose our place
    let placeholder = document.createTextNode("");
    parent.insertBefore(placeholder, this.nodes.last().nextSibling);

    let sharedPreviousOrder = OrderedSet<Node>().asMutable();
    this.nodes.forEach(n => {
      if (sharedDesiredOrder.contains(n)) {
        sharedPreviousOrder.add(n);
      } else {
        // this node is not shared with our new set of nodes, so we can remove
        // it from the dom
        remove(parent, n);
      }
    });

    let previous: Node[] = sharedPreviousOrder.toArray();
    let desired: Node[] = sharedDesiredOrder.toArray();

    let lcs: Node[] = longestCommonSubsequence(previous, desired);

    let i = 0;
    newNodes.forEach(n => {
      if (i === lcs.length) {
        insertBefore(parent, n, placeholder);
      } else if (lcs[i] === n) {
        i++
      } else {
        insertBefore(parent, n, lcs[i]);
      }
    });

    placeholder.remove();

    this.value2Nodes = newValue2Nodes.asImmutable();
    this.nodes = newNodes.asImmutable();
  }
}

class VDOMHandler extends TextHandler {
  willHandle(value) {
    return value instanceof VDOM;
  }
  handle(parent, value) {
    render(value, parent);
    let newNode = parent.lastChild;
    replaceChild(parent, newNode, this.node);
    this.node = newNode;
  }
}

class NodeHandler extends TextHandler {
  willHandle(value) {
    return value instanceof Node;
  }
  handle(parent, value) {
    replaceChild(parent, value, this.node);
    this.node = value;
  }
}

function renderDerivable(thing: Derivable<any>, parent: HTMLElement) {
  /// placeholder
  let placeholder = document.createTextNode('');
  parent.appendChild(placeholder);

  let handler: DerivableHandler = new TextHandler();
  handler.init(parent, placeholder);

  const reaction = thing.reaction(val => {
    if (val == null) {
      val = '';
    }
    if (handler.willHandle(val)) {
      handler.handle(parent, val);
    } else {
      handler.expire(parent, placeholder);
      if (val instanceof List || val instanceof Array) {
        handler = new ListHandler();
      } else if (val instanceof VDOM) {
        handler = new VDOMHandler();
      } else if (val instanceof Node) {
        handler = new NodeHandler();
      } else {
        handler = new TextHandler();
      }
      if (!handler.willHandle(val)) {
        handler = new TextHandler();
      }
      handler.init(parent, placeholder);
      handler.handle(parent, val);
    }
  });

  if (parent[IN_DOM]) {
    parent[IN_DOM].react(inDom => {
      if (inDom) {
        reaction.start().force();
      } else {
        reaction.stop();
      }
    });
  }
}
