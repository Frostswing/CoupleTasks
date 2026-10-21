import { twoColumnCardWidth } from "../src/utils/displayName.js";

const pad = 16;
const gap = 8;
const w390 = twoColumnCardWidth(390, pad, gap);
const w360 = twoColumnCardWidth(360, pad, gap);
if (w390 < 160) throw new Error(`390px card too narrow: ${w390}`);
if (w360 < 150) throw new Error(`360px card too narrow: ${w360}`);
if (w390 * 2 + gap + pad * 2 > 390) throw new Error("390 layout overflow");
console.log(`✓ two-column grid width 390→${w390}px, 360→${w360}px`);
