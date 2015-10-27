var immutable_1 = require('immutable');
var derivable_1 = require('derivable');
function populateMatrix(a, b) {
    var matrix = [];
    for (var i = 0; i < b.length; i++) {
        var row = [];
        for (var j = 0; j < a.length; j++) {
            var rowPrev = row[j - 1] || 0;
            var colPrev = i > 0 ? matrix[i - 1][j] : 0;
            var best = Math.max(rowPrev, colPrev) + (a[j] === b[i] ? 1 : 0);
            row[j] = best;
        }
        matrix.push(row);
    }
    return matrix;
}
function backtrack(result, matrix, a, b, i, j) {
    if (i === -1 || j === -1) {
        return;
    }
    else if (a[j] === b[i]) {
        result.unshift(a[j]);
        backtrack(result, matrix, a, b, i - 1, j - 1);
    }
    else if (matrix[i - 1][j] > matrix[i][j - 1]) {
        backtrack(result, matrix, a, b, i - 1, j);
    }
    else {
        backtrack(result, matrix, a, b, i, j - 1);
    }
}
function longestCommonSubsequence(a, b) {
    var result = [];
    backtrack(result, populateMatrix(a, b), a, b, b.length - 1, a.length - 1);
    return result;
}
exports.longestCommonSubsequence = longestCommonSubsequence;
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
        return result[prop] = derivable_1.isAtom(d) ? d.lens(cursor(prop)) : d.derive(function (d) { return d.get(prop); });
    });
    return result;
}
exports.destruct = destruct;
function renderClass(obj) {
    if (obj instanceof Array) {
        return obj.map(renderClass).join(" ");
    }
    else if (typeof obj === 'string' || obj instanceof String) {
        return obj;
    }
    else if (obj instanceof immutable_1.Map) {
        return obj.map(function (v, k) { return v ? renderClass(k) : ""; }).join(" ");
    }
    else {
        var result = "";
        for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
            var k = _a[_i];
            if (obj[k]) {
                result += " " + k;
            }
        }
        return result.slice(1);
    }
}
exports.renderClass = renderClass;
