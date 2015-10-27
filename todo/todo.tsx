import { render, dom } from '../src/domlock'
import { cmap, ucmap } from '../src/caching'
import { destruct, renderClass } from '../src/util'

import * as _ from 'havelock'
import { atom, Derivable, Atom } from 'havelock'
import * as imut from 'immutable'
import { Map, List, fromJS } from 'immutable'

const React = {createElement: dom};


/*** Global App State ***/
let nextId = 0; // make uids for list items
function getNextId (): number {
  return nextId++;
}

const todos = atom(fromJS([]));
const hash = atom(window.location.hash);

window.addEventListener('hashchange', () => {
  hash.set(window.location.hash);
});

{
  let existingTodos;
  if ((existingTodos = localStorage['todos'])) {
    todos.set(fromJS(JSON.parse(existingTodos))
                .map(x => x.set('id', getNextId()))
                .toList());
  }
}

todos.react(todos => {
  localStorage['todos'] = JSON.stringify(todos.toJS());
});

/*** Business Logic ***/
function newTodo (todos, description) {
  if (description.trim().length === 0) {
    return todos;
  } else {
    return todos.push(fromJS({
      description,
      id: getNextId(),
      completed: false,
      editing: false
    }));
  }
}

function clearCompleted (todos) {
  return todos.filter(t => !t.get('completed')).toList();
}

function toggleComplete (todos, idx) {
  return todos.updateIn([idx, 'completed'], x => !x);
}

function deleteTodo (todos, idx) {
  return todos.delete(idx);
}

function editingTodo (todos, idx, editing) {
  return todos.setIn([idx, 'editing'], editing);
}

function editTodo (todos, idx, newDescription) {
  if (newDescription.trim().length === 0) {
    return deleteTodo(todos, idx);
  } else {
    return todos.setIn([idx, 'description'], newDescription);
  }
}

function markAll (todos, completed) {
  return todos.map(t => t.set('completed', completed)).toList();
}


/*** Derived Data ***/

const numTodos = todos.derive(ts => ts.size);

const numRemaining = todos.derive(ts => ts.filter(t => !t.get("completed")).size);

const allCompleted = numTodos.and(numRemaining.not());
const allIncomplete = numTodos.is(numRemaining);

const showing = hash.switch(
  "#/active", "active",
  "#/completed", "completed",
  "all"
);
//
//
// /*** VIEW ***/
//
// helpers
function onEnter (fn) {
  return ev => {
    if (ev.which === 13) {
      fn(ev);
    }
  }
}


function renderTodo(todo, idx) {
  const { description, completed, editing } = destruct(todo, 'description', 'completed', 'editing');
  const show = showing.switch(
    "active", completed.not(),
    "completed", completed,
    true
  );

  const inputNode = atom(null);
  const startEditing = () => {
    todos.swap(editingTodo, idx.get(), true);
    inputNode.get().value = description.get();
    inputNode.get().focus();
  };
  const stopEditing = _.transaction(ev => {
    todos.swap(editingTodo, idx.get(), false);
    todos.swap(editTodo, idx.get(), ev.target.value);
  });

  return (
    <li $class={{editing, completed}} $show={show}>
      <div $class="view">
        <input $class="toggle" type="checkbox" checked={completed} onchange={ () => todos.swap(toggleComplete, idx.get()) } />
        <label ondblclick={ startEditing }>{description}</label>
        <button $class="destroy" onclick={ ev => todos.swap(deleteTodo, idx.get()) }></button>
      </div>
      <input $class="edit"
             $node={inputNode}
             onblur={stopEditing}
             onkeypress={onEnter(ev => ev.target.blur())}
             onfocus={ev => ev.target.select()}/>
    </li>
  );
}

const todosElem = (
    <section $class="main" $hide={numTodos.is(0)}>
      <input $class="toggle-all"
             id="toggle-all"
             type="checkbox"
             checked={allCompleted}
             onchange={ () => todos.swap(markAll, !allCompleted.get()) } />
      <label htmlFor="toggle-all">Mark all as {allCompleted.then('in', '')}complete</label>
      <ul $class="todo-list">
        { ucmap(x => x.get('id'), renderTodo, todos) }
      </ul>
    </section>
);

const footerElem = (
    <footer $class="footer">
      <span $class="todo-count"><strong>{numRemaining}</strong> items left</span>
      <ul $class="filters">
        <li>
          <a $class={{selected: showing.is('all')}}  href="#/">
            All
          </a>
        </li>
        <li>
          <a $class={{selected: showing.is('active')}} href="#/active">
            Active
          </a>
        </li>
        <li>
          <a $class={{selected: showing.is('completed')}} href="#/completed">
            Completed
          </a>
        </li>
      </ul>
      <button $class="clear-completed"
              $hide={allIncomplete}
              onclick={() => todos.swap(clearCompleted)}>Clear completed</button>
    </footer>
);

const pageElem = (
  <section $class="todoapp">
    <header $class="header">
      <h1>todos</h1>
      <input $class="new-todo"
             placeholder="What needs to be done?"
             onkeypress={onEnter(ev => {
               todos.swap(newTodo, ev.target.value);
               ev.target.value = "";
             })}
             autofocus />
    </header>
    {todosElem}
    {footerElem}
  </section>
);

window.addEventListener('load', () => render(pageElem, document.getElementById('main')));
