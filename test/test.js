var domlock_1 = require('../src/domlock');
var caching_1 = require('../src/caching');
var _ = require('havelock');
var imut = require('immutable');
var React = { createElement: domlock_1.dom };
var time = _.atom(+new Date());
var timeString = time.derive(function (time) { return new Date(time).toTimeString(); });
var timeElem = timeString.derive(function (ts) { return React.createElement("span", null, ts); });
window.setInterval(function () { return time.set(+new Date()); }, 1000);
var things = _.atom(imut.fromJS([
    { name: "steve", age: 32 },
    { name: "wilbur", age: 407 }
]));
var alphabet = _.atom(imut.List("abcdefghijklmnopqrstuvwxyz".split('')));
var wrap = function (xs) { return xs.slice(1).push(xs.first()); };
var inc = function (x) { return x + 1; };
function renderThing(thing) {
    var _a = caching_1.destruct(thing, 'name', 'age'), name = _a.name, age = _a.age;
    return React.createElement("div", {"onclick": function () { return age.swap(inc); }}, "person: ", name, "(", age, ")");
}
var jism = _.atom(null);
var klass = _.atom("jism");
var x = React.createElement("div", {"className": klass, "$node": jism}, "Bananas on fire: ", timeElem, React.createElement("br", null), React.createElement("button", {"onclick": function () { alphabet.swap(wrap); klass.set(klass.get() + " banana"); }}, "shamona!"), React.createElement("br", null), alphabet, caching_1.cmap(renderThing, things));
window.addEventListener('load', function () { return domlock_1.render(x, document.body); });
