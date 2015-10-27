import { render, dom } from '../src/domlock'
import { cmap, ucmap } from '../src/caching'
import { destruct } from '../src/util'

import * as _ from 'havelock'
import * as imut from 'immutable'

const React = {createElement: dom};

const dynamics = _.atom(30);
const incd = d => d + 1 % 100;
const decd = d => d - 1 % 100;

const width = _.atom(10);
const height = _.atom(10);

function rgb(x, y, w, h, d) {
  let r = Math.abs(Math.round(Math.sin(x * 2 * Math.PI / w) * 256) + d) % 256,
      g = Math.abs(Math.round(Math.cos(y * 2 * Math.PI / h) * 256) - d) % 256,
      b = ((x * y) - d) % 256;
  return `rgb(${r}, ${g}, ${b})`;
}
import {Derivable} from 'havelock';

function pixel (coords) {
  let x: Derivable<number>, y: Derivable<number>;
  x = coords.derive(({x}) => x);
  y = coords.derive(({y}) => y);

  const top = height.derive(h => (100 * y.get() / h) + "%");
  const left = width.derive(w => (100 * x.get() / w) + "%");
  const color = _.lift(rgb)(x, y, width, height, dynamics);
  const pixelWidth = width.derive(w => (100 / w) + "%");
  const pixelHeight = height.derive(h => (100 / h) + "%");
  var style = {top, left, width: pixelWidth, height: pixelHeight, background: color, position: 'absolute'};
  return <div $style={style}></div>
}

const indices = _.derivation(() => {
  console.log("franny")
  return imut.Range(0, height.get())
             .flatMap(row => imut.Range(0, width.get()).map(col => ({x: col, y: row}))).toList();
});

window.addEventListener('load', () => {
  console.log("jimmy")
  render(<div>{cmap(pixel, indices)}</div>, document.body);
});


window.addEventListener('keydown', ev => {
  if (ev.which === 40) {
    // down
    dynamics.swap(decd);
  } else if (ev.which === 38) {
    //up
    dynamics.swap(incd);
  }
});
