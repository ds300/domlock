/// <reference path="../node_modules/havelock/dist/havelock.d.ts"/>
/// <reference path="../node_modules/immutable/dist/immutable.d.ts"/>

import { Atom, Derivable, Reaction, Lens } from 'havelock'
import * as _ from 'havelock'
import { List, Map } from 'immutable'

// we're gonna use the ids + id2idx pattern a few more times so for brevity...
interface IDStuff<U> {
  ids: Derivable<List<U>>
  id2idx: Derivable<Map<U, number>>
}

function deriveIDStuff<T, U> (uf: (v:T) => U, xs: Derivable<List<T>>): IDStuff<U> {
  const ids: Derivable<List<U>> = xs.derive(xs => xs.map(uf).toList());
  const id2idx: Derivable<Map<U, number>> = ids.derive(ids => {
    let map = Map<U, number>().asMutable();
    ids.forEach((id, idx) => {
      map.set(id, idx);
    });
    return map.asImmutable();
  });
  return {ids, id2idx};
}

function lookup<T, U> (xs: List<T>, id2idx: Map<U, number>, id: U): T {
  return xs.get(id2idx.get(id));
}

function lookupCursor<T, U>(
  id2idx: Derivable<Map<U, number>>,
  id: U
): Lens<List<T>, T> {
  return {
    get (xs: List<T>): T {
      return xs.get(id2idx.get().get(id));
    },
    set (xs: List<T>, value: T): List<T> {
      return xs.set(id2idx.get().get(id), value);
    }
  }
}

const NOT_FOUND = {};

export function ucmap<I, O, U>(
    uf: (i: I) => U,
    f: (i: Derivable<I>) => O,
    xs: Derivable<List<I>>
  ): Derivable<List<O>> {

  let cache: Map<U, O> = Map<U, O>();

  const {ids, id2idx} = deriveIDStuff<I, U>(uf, xs);

  return ids.derive(ids => {
    let newCache = Map<U, O>().asMutable();
    let result = [];

    ids.forEach(id => {
      // allow duplicates
      let value: O = newCache.get(id, <O>NOT_FOUND);
      if (value === NOT_FOUND) {
        value = cache.get(id, <O>NOT_FOUND);
        if (value === NOT_FOUND) {
          var deriv = _.isAtom(xs) ? (<Atom<List<I>>>xs).lens(lookupCursor<I, U>(id2idx, id)) : xs.derive(lookup, id2idx, id);
          value = f(deriv);
        }
        newCache.set(id, value);
      }
      result.push(value);
    });

    cache = newCache.asImmutable();
    return List(result);
  });
};

const identity = x => x;

export function cmap<I, O>(f: (i: Derivable<I>) => O, xs: Derivable<List<I>>): Derivable<List<O>> {
  return ucmap(identity, f, xs);
}

export function cursor<T>(prop: string): Lens<Map<string, T>, T>{
  return {
    get (state: Map<string, T>) {
      return state && state.get(prop);
    },
    set (state: Map<string, T>, value: T) {
      return state.set(prop, value);
    }
  }
}

export function destruct<T>(d: Atom<Map<string, T>>, ...props: string[]): {[key: string]: Atom<T>};
export function destruct<T>(d: Derivable<Map<string, T>>, ...props: string[]): {[key: string]: Derivable<T>};
export function destruct<T>(d, ...props) {
  let result = {};

  props.forEach(prop =>
    result[prop] = _.isAtom(d) ? (<Atom<Map<string, T>>>d).lens(cursor<T>(prop)) : d.derive(d => d.get(prop))
  );

  return <any>result;
}
