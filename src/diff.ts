/*****************************************/
/*** LIST DIFFING + PATCHING ALGORITHM ***/
/*****************************************/

/*

This framework doesn't need full-on tree diffing. It does, however, need simple
flat list diffing in order to decide the most efficient way to re-order a list
of child nodes given the sliding operation (Node#insertBefore).

The algorithm is roughly as follows:

Input:
  from_array: the current order of nodes
  to_array: the desired order of nodes

1. mark from_array into sections which are contiguous in to_array

   e.g. given from_array being [3,4,1,2,5], and to_array being [1, 2, 3, 4, 5]
        the sections would be as follows:

          [   3   ,   4   ,   1   ,   2   ,   5   ]
            | - - - - - |   | - - - - - |   | - |
              section 0       section 1       section 2
            from_start: 0   from_start: 2   from_start: 4
            to_start:   2   to_start:   0   to_start:   4
            length:     2   length:     2   length:     1

2. pick the 'best' not-necessarily-contiguous subsequence of sections which appear
   in the 'correct' order. 'best' meaning 'has the highest sum of combined lengths'.
   and 'correct' meaning the same as in to_array.

   e.g. in the example above, there are two section subsequences with weight 3:
        [0, 2] (elements: 3,4,5) and [1, 2] (elements: 1,2,5). It doesn't matter
        which is picked in the case that there are more than one 'best' subsequence.

3. Select these sections as the 'anchor' sections, which will not be moved.

4. Iterate over the remaining sections, sliding their individual elements to be
   between the correct two anchors, or at either end, then turning the sections
   into anchors themselves.


I haven't proved that this produces the most efficient set of slide operations for
any given transformation, but it *feels* right and I haven't managed to find any
counterexamples so odds are good I reckon.
*/

interface Section {
  current_start: number;
  desired_start: number;
  length: number;
}

/**
 * Returns a list of sections over the current configuration
 */
function findSections (current: any[], desired: any[]) : Section[] {
  if (current.length === 0) { return []; }
  const result = [];

  let currentSection = {
    current_start: 0,
    desired_start: desired.indexOf(current[0]),
    length: 1
  };
  for (let current_idx = 1; current_idx < current.length; current_idx++) {
    let desired_idx = desired.indexOf(current[current_idx]);
    if (desired_idx === currentSection.desired_start + currentSection.length) {
      currentSection.length++;
    } else {
      result.push(currentSection);
      currentSection = {
        current_start: current_idx,
        desired_start: desired_idx,
        length: 1
      }
    }
  }
  result.push(currentSection);

  return result;
}

/**
 * finds the 'best' section subsequence
 */
function bestIncreasingSectionSequence (sections: Section[]): number[] {
  let best = {sequence: [], weight: 0};

  function descend (sequence: number[], idx: number, last_desired_start: number) {
    if (idx < sections.length) {
      if (sections[idx].desired_start > last_desired_start) {
        let sequence2 = sequence.slice(0);
        sequence2.push(idx)
        let last_desired_start2 = sections[idx].desired_start;
        descend(sequence2, idx+1, last_desired_start2);
      }
      descend(sequence, idx+1, last_desired_start);
    } else if (sequence.length) {
      let weight = sequence.reduce((a, i) => a + sections[i].length, 0);
      if (best.weight < weight) {
        best = {weight, sequence};
      }
    }
  }

  descend([], 0, -1);

  return best.sequence;
}

/**
 * calls f with sliding instructions based on the given sections and anchor subsequence
 */
function executeTranslations(sections: Section[], bestSubseqence: number[], f: (a: number, b: number) => void) {
  const anchors = bestSubseqence.map(i => sections[i]);

  sections.forEach(section => {
    if (anchors.indexOf(section) < 0) {
      let i = 0;
      while (i < anchors.length && anchors[i].desired_start < section.desired_start) {
        i++;
      }
      const insertBefore = i < anchors.length ? anchors[i].current_start : null;
      for (let x = 0; x < section.length; x++) {
        f(insertBefore, x + section.current_start);
      }
      anchors.splice(i, 0, section);
    }
  });
}

/**
 * executes f with sliding instructions in order to make current look like desired
 */
export function applyDiff(current: any[], desired: any[], f: (insertBefore: number, thing: number) => void) {
  let sections = findSections(current, desired);
  let best = bestIncreasingSectionSequence(sections);
  executeTranslations(sections, best, f);
}
