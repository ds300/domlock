var domlock_1 = require('../src/domlock');
var caching_1 = require('../src/caching');
var util_1 = require('../src/util');
var _ = require('havelock');
var havelock_1 = require('havelock');
var immutable_1 = require('immutable');
var React = { createElement: domlock_1.dom };
var nextId = 0;
function getNextId() {
    return nextId++;
}
var todos = havelock_1.atom(immutable_1.fromJS([]));
var hash = havelock_1.atom(window.location.hash);
window.addEventListener('hashchange', function () {
    hash.set(window.location.hash);
});
{
    var existingTodos;
    if ((existingTodos = localStorage['todos'])) {
        todos.set(immutable_1.fromJS(JSON.parse(existingTodos))
            .map(function (x) { return x.set('id', getNextId()); })
            .toList());
    }
}
todos.react(function (todos) {
    localStorage['todos'] = JSON.stringify(todos.toJS());
});
function newTodo(todos, description) {
    if (description.trim().length === 0) {
        return todos;
    }
    else {
        return todos.push(immutable_1.fromJS({
            description: description,
            id: getNextId(),
            completed: false,
            editing: false
        }));
    }
}
function clearCompleted(todos) {
    return todos.filter(function (t) { return t.complete; }).toList();
}
function toggleComplete(todos, idx) {
    return todos.updateIn([idx, 'completed'], function (x) { return !x; });
}
function deleteTodo(todos, idx) {
    return todos.delete(idx);
}
function editingTodo(todos, idx, editing) {
    return todos.setIn([idx, 'editing'], editing);
}
function editTodo(todos, idx, newDescription) {
    if (newDescription.trim().length === 0) {
        return deleteTodo(todos, idx);
    }
    else {
        return todos.setIn([idx, 'description'], newDescription);
    }
}
function markAll(todos, completed) {
    return todos.map(function (t) { return t.set('completed', completed); }).toList();
}
var numTodos = todos.derive(function (ts) { return ts.size; });
var numRemaining = todos.derive(function (ts) { return ts.filter(function (t) { return !t.get("completed"); }).size; });
var allCompleted = numTodos.and(numRemaining.not());
var allIncomplete = numTodos.is(numRemaining);
var showing = hash.switch("#/active", "active", "#/completed", "completed", "all");
function onEnter(fn) {
    return function (ev) {
        if (ev.which === 13) {
            fn(ev);
        }
    };
}
function renderTodo(todo, idx) {
    var _a = util_1.destruct(todo, 'description', 'completed', 'editing'), description = _a.description, completed = _a.completed, editing = _a.editing;
    var show = showing.switch("active", completed.not(), "completed", completed, true);
    var klass = _.struct({ editing: editing, completed: completed }).derive(util_1.renderClass);
    var inputNode = havelock_1.atom(null);
    var startEditing = function () {
        todos.swap(editingTodo, idx.get(), true);
        inputNode.get().value = description.get();
        inputNode.get().focus();
    };
    var stopEditing = _.transaction(function (ev) {
        todos.swap(editingTodo, idx.get(), false);
        todos.swap(editTodo, idx.get(), ev.target.value);
    });
    return (React.createElement("li", {"className": klass, "$show": show}, React.createElement("div", {"className": "view"}, React.createElement("input", {"className": "toggle", "type": "checkbox", "checked": completed, "onchange": function () { return todos.swap(toggleComplete, idx.get()); }}), React.createElement("label", {"ondblclick": startEditing}, description), React.createElement("button", {"className": "destroy", "onclick": function (ev) { return todos.swap(deleteTodo, idx.get()); }})), React.createElement("input", {"className": "edit", "$node": inputNode, "onblur": stopEditing, "onkeypress": onEnter(function (ev) { return ev.target.blur(); }), "onfocus": function (ev) { return ev.target.select(); }})));
}
var todosElem = (React.createElement("section", {"className": "main", "$hide": numTodos.is(0)}, React.createElement("input", {"className": "toggle-all", "type": "checkbox", "checked": allCompleted, "onchange": function () { return todos.swap(markAll, !allCompleted.get()); }}), React.createElement("label", {"htmlFor": "toggle-all"}, "Mark all as ", allCompleted.then('in', ''), "complete"), React.createElement("ul", {"className": "todo-list"}, caching_1.ucmap(function (x) { return x.get('id'); }, renderTodo, todos))));
var footerElem = (React.createElement("footer", {"className": "footer"}, React.createElement("span", {"className": "todo-count"}, React.createElement("strong", null, numRemaining), " items left"), React.createElement("ul", {"className": "filters"}, React.createElement("li", null, React.createElement("a", {"$class": { selected: showing.is('all') }, "href": "#/"}, "All")), React.createElement("li", null, React.createElement("a", {"$class": { selected: showing.is('active') }, "href": "#/active"}, "Active")), React.createElement("li", null, React.createElement("a", {"$class": { selected: showing.is('completed') }, "href": "#/completed"}, "Completed"))), React.createElement("button", {"className": "clear-completed", "$hide": allIncomplete, "onclick": function () { return todos.swap(clearCompleted); }}, "Clear completed")));
var pageElem = (React.createElement("section", {"className": "todoapp"}, React.createElement("header", {"className": "header"}, React.createElement("h1", null, "todos"), React.createElement("input", {"className": "new-todo", "placeholder": "What needs to be done?", "onkeypress": onEnter(function (ev) {
    todos.swap(newTodo, ev.target.value);
    ev.target.value = "";
}), "autofocus": true})), todosElem, footerElem));
window.addEventListener('load', function () { return domlock_1.render(pageElem, document.getElementById('main')); });
React.createElement("div", null, "word ", React.createElement("code", null, "code"), " word");
