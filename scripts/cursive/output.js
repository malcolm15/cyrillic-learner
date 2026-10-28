// Shared by the hand-run generators in scripts/cursive/: where their output
// may go. By default only inside ~/.cyrilica/harness/cursive/ (any folder
// there), never the repository, because their output goes live only by being
// copied into the site in a reviewed batch. --allow-output-outside-harness
// lifts the rule for one run. Never part of the Netlify build.

const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO = path.resolve(__dirname, '..', '..');
const HARNESS = path.join(os.homedir(), '.cyrilica', 'harness', 'cursive');
const OVERRIDE = '--allow-output-outside-harness';

// The real path of p, resolving symlinks in the part that already exists.
function realOf(p) {
    let head = path.resolve(p);
    const rest = [];
    while (!fs.existsSync(head)) {
        rest.unshift(path.basename(head));
        const up = path.dirname(head);
        if (up === head) break;
        head = up;
    }
    return path.join(fs.realpathSync(head), ...rest);
}
function inside(child, parent) {
    const rel = path.relative(parent, child);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}
// Returns the absolute folder, or calls refuse(message) if it is not allowed.
function checkDestination(dir, allowAnywhere, tool, refuse) {
    const abs = path.resolve(dir);
    if (allowAnywhere) return abs;
    if (!fs.existsSync(HARNESS)) refuse('the harness folder ' + HARNESS + ' does not exist; create it, or pass ' + OVERRIDE);
    const real = realOf(abs);
    if (inside(real, fs.realpathSync(HARNESS)) && !inside(real, fs.realpathSync(REPO))) return abs;
    const where = inside(real, fs.realpathSync(REPO)) ? ' It is inside the repository (' + REPO + ').' : '';
    refuse('will not write to ' + abs + '.' + where + ' ' + tool + ' writes only inside ' + HARNESS +
           ', because its output goes live only through a reviewed batch. To write elsewhere anyway, pass ' + OVERRIDE + '.');
}

module.exports = { REPO, HARNESS, OVERRIDE, checkDestination };
