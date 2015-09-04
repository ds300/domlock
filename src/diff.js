/*****************************************/
/*** LIST DIFFING + PATCHING ALGORITHM ***/
/*****************************************/
function findSections(current, desired) {
    if (current.length === 0) {
        return [];
    }
    var result = [];
    var currentSection = {
        current_start: 0,
        desired_start: desired.indexOf(current[0]),
        length: 1
    };
    for (var current_idx = 1; current_idx < current.length; current_idx++) {
        var desired_idx = desired.indexOf(current[current_idx]);
        if (desired_idx === currentSection.desired_start + currentSection.length) {
            currentSection.length++;
        }
        else {
            result.push(currentSection);
            currentSection = {
                current_start: current_idx,
                desired_start: desired_idx,
                length: 1
            };
        }
    }
    result.push(currentSection);
    return result;
}
function bestIncreasingSectionSequence(sections) {
    var best = { sequence: [], weight: 0 };
    function descend(sequence, idx, last_desired_start) {
        if (idx < sections.length) {
            if (sections[idx].desired_start > last_desired_start) {
                var sequence2 = sequence.slice(0);
                sequence2.push(idx);
                var last_desired_start2 = sections[idx].desired_start;
                descend(sequence2, idx + 1, last_desired_start2);
            }
            descend(sequence, idx + 1, last_desired_start);
        }
        else if (sequence.length) {
            var weight = sequence.reduce(function (a, i) { return a + sections[i].length; }, 0);
            if (best.weight < weight) {
                best = { weight: weight, sequence: sequence };
            }
        }
    }
    descend([], 0, -1);
    return best.sequence;
}
function executeTranslations(sections, bestSubseqence, f) {
    var anchors = bestSubseqence.map(function (i) { return sections[i]; });
    sections.forEach(function (section) {
        if (anchors.indexOf(section) < 0) {
            var i = 0;
            while (i < anchors.length && anchors[i].desired_start < section.desired_start) {
                i++;
            }
            var insertBefore = i < anchors.length ? anchors[i].current_start : null;
            for (var x = 0; x < section.length; x++) {
                f(insertBefore, x + section.current_start);
            }
            anchors.splice(i, 0, section);
        }
    });
}
function applyDiff(current, desired, f) {
    var sections = findSections(current, desired);
    var best = bestIncreasingSectionSequence(sections);
    executeTranslations(sections, best, f);
}
exports.applyDiff = applyDiff;
