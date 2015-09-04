/// <reference path="../node_modules/havelock/dist/havelock.d.ts"/>
/// <reference path="../node_modules/immutable/dist/immutable.d.ts"/>
var _ = require('havelock');
var immutable_1 = require('immutable');
function deriveIDStuff(uf, xs) {
    var ids = xs.derive(function (xs) { return xs.map(uf).toList(); });
    var id2idx = ids.derive(function (ids) {
        var map = immutable_1.Map().asMutable();
        ids.forEach(function (id, idx) {
            map.set(id, idx);
        });
        return map.asImmutable();
    });
    return { ids: ids, id2idx: id2idx };
}
function lookup(xs, id2idx, id) {
    return xs.get(id2idx.get(id));
}
function lookupCursor(id2idx, id) {
    return {
        get: function (xs) {
            return xs.get(id2idx.get().get(id));
        },
        set: function (xs, value) {
            return xs.set(id2idx.get().get(id), value);
        }
    };
}
var NOT_FOUND = {};
function ucmap(uf, f, xs) {
    var cache = immutable_1.Map();
    var _a = deriveIDStuff(uf, xs), ids = _a.ids, id2idx = _a.id2idx;
    return ids.derive(function (ids) {
        var newCache = immutable_1.Map().asMutable();
        var result = [];
        ids.forEach(function (id) {
            var value = newCache.get(id, NOT_FOUND);
            if (value === NOT_FOUND) {
                value = cache.get(id, NOT_FOUND);
                if (value === NOT_FOUND) {
                    var deriv = _.isAtom(xs) ? xs.lens(lookupCursor(id2idx, id)) : xs.derive(lookup, id2idx, id);
                    value = f(deriv);
                }
                newCache.set(id, value);
            }
            result.push(value);
        });
        cache = newCache.asImmutable();
        return immutable_1.List(result);
    });
}
exports.ucmap = ucmap;
;
var identity = function (x) { return x; };
function cmap(f, xs) {
    return ucmap(identity, f, xs);
}
exports.cmap = cmap;
function cursor(prop) {
    return {
        get: function (state) {
            return state && state.get(prop);
        },
        set: function (state, value) {
            return state.set(prop, value);
        }
    };
}
exports.cursor = cursor;
function destruct(d) {
    var props = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        props[_i - 1] = arguments[_i];
    }
    var result = {};
    props.forEach(function (prop) {
        return result[prop] = _.isAtom(d) ? d.lens(cursor(prop)) : d.derive(function (d) { return d.get(prop); });
    });
    return result;
}
exports.destruct = destruct;
