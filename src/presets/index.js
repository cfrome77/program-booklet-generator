import blank from './blank.js';
import oa75th from './oa75th.js';
import generic from './generic.js';

export { blankPreset, default as blank } from './blank.js';
export { oa75thPreset, default as oa75th } from './oa75th.js';
export { genericPreset, default as generic } from './generic.js';

export const PRESETS = {
  blank,
  oa75: oa75th,
  oa75th,
  generic
};

export default PRESETS;
