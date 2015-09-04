import { render, dom } from '../src/domlock'
import { cmap, destruct, ucmap } from '../src/caching'

import * as _ from 'havelock'
import * as imut from 'immutable'

const React = {createElement: dom};

const time = _.atom(+new Date());
const timeString = time.derive(time => new Date(time).toTimeString());
const timeElem = timeString.derive(ts => <span>{ts}</span>);

window.setInterval(() => time.set(+new Date()), 1000);

const things = _.atom(imut.fromJS([
  {name: "steve", age: 32},
  {name: "wilbur", age: 407}
]));

const alphabet = _.atom(imut.List("abcdefghijklmnopqrstuvwxyz".split('')));

const wrap = xs => xs.slice(1).push(xs.first());

const inc = x => x + 1

function renderThing (thing: _.Atom<any>) {
  let {name, age} = destruct(thing, 'name', 'age');

  return <div onclick={() => age.swap(inc)}>person: {name} ({age})</div>;
}

const node = _.atom(null);
const klass = _.atom("banana");
const moarBanana = x => x + " banana";

const x = <div className={klass} $node={node}>
              Bananas on fire: {timeElem} <br />
              <button onclick={() => {alphabet.swap(wrap); klass.swap(moarBanana)}}>
                more banana!
              </button>
              <br />
              {alphabet}
              {cmap(renderThing, things)}
          </div>;

window.addEventListener('load', () => render(x, document.body))
