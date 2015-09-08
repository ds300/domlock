/// <reference path="../node_modules/havelock/dist/havelock.d.ts"/>
/// <reference path="../node_modules/immutable/dist/immutable.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require('havelock');
var immutable_1 = require('immutable');
var VDOM = (function () {
    function VDOM(tagName, props, children) {
        this.tagName = tagName;
        this.props = props;
        this.children = children;
    }
    VDOM.prototype.equals = function (other) {
        return other === this;
    };
    return VDOM;
})();
exports.VDOM = VDOM;
function dom(tagName, props) {
    var children = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        children[_i - 2] = arguments[_i];
    }
    if (typeof tagName !== 'string') {
        throw new Error("domlock only supports regular html tags.");
    }
    return new VDOM(tagName, props || {}, children);
}
exports.dom = dom;
function render(thing, parent) {
    if (thing instanceof VDOM) {
        renderVDOM(thing, parent);
    }
    else if (_.isDerivable(thing)) {
        renderDerivable(thing, parent);
    }
    else {
        renderString(thing, parent);
    }
}
exports.render = render;
var TMP_NODE = document.createElement('div');
function toNode(thing) {
    if (thing instanceof Array || thing instanceof immutable_1.List || _.isDerivable(thing)) {
        throw new Error("can't coerce arrays, lists, or derivables to nodes");
    }
    else if (thing instanceof Node) {
        return thing;
    }
    else {
        render(thing, TMP_NODE);
        var rendered = TMP_NODE.lastChild;
        while (TMP_NODE.lastChild) {
            TMP_NODE.removeChild(TMP_NODE.lastChild);
        }
        return rendered;
    }
}
exports.toNode = toNode;
var IN_DOM = '__havelock__elemInDom';
var PARENT = '__havelock__elemParent';
function ensureParentState(parent) {
    if (!parent[IN_DOM]) {
        parent[IN_DOM] = _.atom(document.body.contains(parent));
    }
}
function ensureChildState(child) {
    if (!child[PARENT]) {
        child[PARENT] = _.atom(null);
        child[IN_DOM] = child[PARENT].derive(function (p) { return p && p[IN_DOM].get(); });
    }
}
function appendChild(parent, child) {
    ensureParentState(parent);
    ensureChildState(child);
    child[PARENT].set(parent);
    parent.appendChild(child);
}
exports.appendChild = appendChild;
function replaceChild(parent, newChild, oldChild) {
    ensureParentState(parent);
    ensureChildState(newChild);
    newChild[PARENT].set(parent);
    oldChild[PARENT] && oldChild[PARENT].set(null);
    parent.replaceChild(newChild, oldChild);
}
exports.replaceChild = replaceChild;
function insertBefore(parent, newChild, referenceChild) {
    ensureParentState(parent);
    ensureChildState(newChild);
    newChild[PARENT].set(parent);
    parent.insertBefore(newChild, referenceChild);
}
exports.insertBefore = insertBefore;
function remove(child) {
    child[PARENT] && child[PARENT].set(null);
    child.remove();
}
exports.remove = remove;
function lifecycle(child, onMount, onUnmount) {
    ensureChildState(child);
    var r = child[IN_DOM].reaction(function (inDom) {
        if (inDom) {
            onMount && onMount();
        }
        else {
            onUnmount && onUnmount();
        }
    }).start();
    if (child[IN_DOM].get()) {
        r.force();
    }
}
exports.lifecycle = lifecycle;
function asMixin(f) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return function (node) { return f.apply([node].concat(args)); };
}
exports.asMixin = asMixin;
function renderVDOM(node, parent) {
    var elem = document.createElement(node.tagName);
    appendChild(parent, elem);
    for (var _i = 0, _a = Object.keys(node.props); _i < _a.length; _i++) {
        var key = _a[_i];
        var val = node.props[key];
        if (_.isDerivable(val)) {
            (function (key, val) {
                var r = val.reaction(function (v) { return elem[key] = v; });
                lifecycle(elem, function () { return r.start().force(); }, function () { return r.stop(); });
            })(key, val);
        }
        else {
            elem[key] = val;
        }
    }
    for (var _b = 0, _c = node.children; _b < _c.length; _b++) {
        var child = _c[_b];
        render(child, elem);
    }
    if (node.props.$node) {
        node.props.$node.set(elem);
    }
    if (node.props.$mixins) {
        node.props.$mixins.forEach(function (m) { return m(elem); });
    }
    if (Object.hasOwnProperty.call(node.props, '$hide')) {
        if (_.isDerivable(node.props.$hide)) {
            node.props.$show = node.props.$hide.not();
        }
        else {
            node.props.$show = !node.props.$hide;
        }
    }
    if (Object.hasOwnProperty.call(node.props, '$show')) {
        if (_.isDerivable(node.props.$show)) {
            var r = node.props.$show.reaction(function (show) {
                if (show) {
                    elem.style.display = "";
                }
                else {
                    elem.style.display = "none";
                }
            });
            lifecycle(elem, function () { return r.start().force(); }, function () { return r.stop(); });
        }
        else if (!node.props.$show) {
            elem.style.display = "none";
        }
    }
    if (node.props.$style) {
        var styles = Object.keys(node.props.$style);
        for (var _d = 0; _d < styles.length; _d++) {
            var style = styles[_d];
            var val = styles[style];
            if (_.isDerivable(val)) {
                (function (style, val) {
                    var r = val.reaction(function (v) { return elem.style[style] = v; });
                    lifecycle(elem, function () { return r.start().force(); }, function () { return r.stop(); });
                })(style, val);
            }
        }
    }
}
function renderString(str, parent) {
    parent.appendChild(document.createTextNode(str));
}
function _walk(f, thing) {
    if (thing instanceof immutable_1.List || thing instanceof Array) {
        thing.forEach(function (x) { return _walk(f, x); });
    }
    else {
        f(thing);
    }
}
function walk(thing, f) {
    _walk(f, thing);
}
var TextHandler = (function () {
    function TextHandler() {
    }
    TextHandler.prototype.init = function (parent, placeholder) {
        this.node = placeholder;
    };
    TextHandler.prototype.expire = function (parent, placeholder) {
        if (this.node) {
            replaceChild(parent, placeholder, this.node);
        }
    };
    TextHandler.prototype.willHandle = function (value) {
        return value &&
            !(value instanceof VDOM) &&
            !(value instanceof immutable_1.List) &&
            !(value instanceof Array) &&
            !(value instanceof Node) &&
            typeof value.toString === 'function';
    };
    TextHandler.prototype.handle = function (parent, value) {
        var newNode = document.createTextNode(value.toString());
        replaceChild(parent, newNode, this.node);
        this.node = newNode;
    };
    return TextHandler;
})();
var BLAH = {};
var util_1 = require('./util');
var ListHandler = (function () {
    function ListHandler() {
    }
    ListHandler.prototype.init = function (parent, placeholder) {
        this.nodes = immutable_1.OrderedSet([placeholder]);
        this.value2Nodes = immutable_1.Map();
    };
    ListHandler.prototype.expire = function (parent, placeholder) {
        this.nodes.slice(1).forEach(remove);
        replaceChild(parent, placeholder, this.nodes.first());
    };
    ListHandler.prototype.willHandle = function (value) {
        return (value instanceof immutable_1.List && value.size > 0) || (value instanceof Array && value.length > 0);
    };
    ListHandler.prototype.handle = function (parent, value) {
        var _this = this;
        var newNodes = immutable_1.OrderedSet().asMutable();
        var newValue2Nodes = immutable_1.Map().asMutable();
        var sharedDesiredOrder = immutable_1.OrderedSet().asMutable();
        walk(value, function (thing) {
            var nodes = _this.value2Nodes.get(thing);
            var node = null;
            if (nodes && nodes.length > 0) {
                node = nodes.shift();
                sharedDesiredOrder.add(node);
            }
            else {
                node = toNode(thing);
            }
            newNodes.add(node);
            var newNodesForThing = newValue2Nodes.get(thing);
            if (newNodesForThing == null) {
                newNodesForThing = [];
                newValue2Nodes.set(thing, newNodesForThing);
            }
            newNodesForThing.push(node);
        });
        var placeholder = document.createTextNode("");
        parent.insertBefore(placeholder, this.nodes.last().nextSibling);
        var sharedPreviousOrder = immutable_1.OrderedSet().asMutable();
        this.nodes.forEach(function (n) {
            if (sharedDesiredOrder.contains(n)) {
                sharedPreviousOrder.add(n);
            }
            else {
                remove(n);
            }
        });
        var previous = sharedPreviousOrder.toArray();
        var desired = sharedDesiredOrder.toArray();
        var lcs = util_1.longestCommonSubsequence(previous, desired);
        var i = 0;
        newNodes.forEach(function (n) {
            if (i === lcs.length) {
                insertBefore(parent, n, placeholder);
            }
            else if (lcs[i] === n) {
                i++;
            }
            else {
                insertBefore(parent, n, lcs[i]);
            }
        });
        placeholder.remove();
        this.value2Nodes = newValue2Nodes.asImmutable();
        this.nodes = newNodes.asImmutable();
    };
    return ListHandler;
})();
var VDOMHandler = (function (_super) {
    __extends(VDOMHandler, _super);
    function VDOMHandler() {
        _super.apply(this, arguments);
    }
    VDOMHandler.prototype.willHandle = function (value) {
        return value instanceof VDOM;
    };
    VDOMHandler.prototype.handle = function (parent, value) {
        render(value, parent);
        var newNode = parent.lastChild;
        replaceChild(parent, newNode, this.node);
        this.node = newNode;
    };
    return VDOMHandler;
})(TextHandler);
var NodeHandler = (function (_super) {
    __extends(NodeHandler, _super);
    function NodeHandler() {
        _super.apply(this, arguments);
    }
    NodeHandler.prototype.willHandle = function (value) {
        return value instanceof Node;
    };
    NodeHandler.prototype.handle = function (parent, value) {
        replaceChild(parent, value, this.node);
        this.node = value;
    };
    return NodeHandler;
})(TextHandler);
function renderDerivable(thing, parent) {
    var placeholder = document.createTextNode('');
    parent.appendChild(placeholder);
    var handler = new TextHandler();
    handler.init(parent, placeholder);
    var reaction = thing.reaction(function (val) {
        if (val == null) {
            val = '';
        }
        if (handler.willHandle(val)) {
            handler.handle(parent, val);
        }
        else {
            handler.expire(parent, placeholder);
            if (val instanceof immutable_1.List || val instanceof Array) {
                handler = new ListHandler();
            }
            else if (val instanceof VDOM) {
                handler = new VDOMHandler();
            }
            else if (val instanceof Node) {
                handler = new NodeHandler();
            }
            else {
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
        parent[IN_DOM].react(function (inDom) {
            if (inDom) {
                reaction.start().force();
            }
            else {
                reaction.stop();
            }
        });
    }
}
