import { List, Map, OrderedSet } from 'immutable'
import { Atom, Derivable, isAtom, Lens } from 'havelock'

function populateMatrix(a: any[], b: any[]): number[][] {
  let matrix = [];

  for (let i = 0; i < b.length; i++) {
    let row = [];
    for (let j = 0; j < a.length; j++) {
      let rowPrev = row[j - 1] || 0;
      let colPrev = i > 0 ? matrix[i-1][j] : 0;
      let best = Math.max(rowPrev, colPrev) + (a[j] === b[i] ? 1 : 0);

      row[j] = best;
    }
    matrix.push(row);
  }

  return matrix;
}

function backtrack(result: any[], matrix: number[][], a: any[], b: any[], i: number, j: number) {
  if (i === -1 || j === -1) {
    return;
  } else if (a[j] === b[i]) {
    result.unshift(a[j]);
    backtrack(result, matrix, a, b, i-1, j-1);
  } else if (matrix[i-1][j] > matrix[i][j-1]){
    backtrack(result, matrix, a, b, i-1, j);
  } else {
    backtrack(result, matrix, a, b, i, j-1);
  }
}

export function longestCommonSubsequence(a: any[], b: any[]): any[] {
  let result = [];
  backtrack(result, populateMatrix(a, b), a, b, b.length - 1, a.length - 1);
  return result;
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
    result[prop] = isAtom(d) ? (<Atom<Map<string, T>>>d).lens(cursor<T>(prop)) : d.derive(d => d.get(prop))
  );

  return <any>result;
}

export function renderClass(obj: any) {
  if (obj instanceof Array) {
    return obj.map(renderClass).join(" ");
  } else if (typeof obj === 'string' || obj instanceof String) {
    return obj;
  } else if (obj instanceof Map) {
    return (<Map<any, boolean>>obj).map((v, k) => v ? renderClass(k) : "").join(" ");
  } else {
    let result = "";
    for (let k of Object.keys(obj)) {
      if (obj[k]) {
        result += " " + k;
      }
    }
    return result.slice(1);
  }
}
