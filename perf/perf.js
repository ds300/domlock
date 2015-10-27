var domlock_1 = require('../src/domlock');
var caching_1 = require('../src/caching');
var _ = require('havelock');
var imut = require('immutable');
var React = { createElement: domlock_1.dom };
var dynamics = _.atom(30);
var incd = function (d) { return d + 1 % 100; };
var decd = function (d) { return d - 1 % 100; };
var width = _.atom(10);
var height = _.atom(10);
function rgb(x, y, w, h, d) {
    var r = Math.abs(Math.round(Math.sin(x * 2 * Math.PI / w) * 256) + d) % 256, g = Math.abs(Math.round(Math.cos(y * 2 * Math.PI / h) * 256) - d) % 256, b = ((x * y) - d) % 256;
    return "rgb(" + r + ", " + g + ", " + b + ")";
}
function pixel(coords) {
    var x, y;
    x = coords.derive(function (_a) {
        var x = _a.x;
        return x;
    });
    y = coords.derive(function (_a) {
        var y = _a.y;
        return y;
    });
    var top = height.derive(function (h) { return (100 * y.get() / h) + "%"; });
    var left = width.derive(function (w) { return (100 * x.get() / w) + "%"; });
    var color = _.lift(rgb)(x, y, width, height, dynamics);
    var pixelWidth = width.derive(function (w) { return (100 / w) + "%"; });
    var pixelHeight = height.derive(function (h) { return (100 / h) + "%"; });
    var style = { top: top, left: left, width: pixelWidth, height: pixelHeight, background: color, position: 'absolute' };
    return React.createElement("div", {"$style": style});
}
var indices = _.derivation(function () {
    console.log("franny");
    return imut.Range(0, height.get())
        .flatMap(function (row) { return imut.Range(0, width.get()).map(function (col) { return ({ x: col, y: row }); }); }).toList();
});
window.addEventListener('load', function () {
    console.log("jimmy");
    domlock_1.render(React.createElement("div", null, caching_1.cmap(pixel, indices)), document.body);
});
window.addEventListener('keydown', function (ev) {
    if (ev.which === 40) {
        dynamics.swap(decd);
    }
    else if (ev.which === 38) {
        dynamics.swap(incd);
    }
});
