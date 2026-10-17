// Generates test data: a random national ID that passes the Thai checksum.
// Run it once, then fix the printed value in the test case:
//
//   node tools/randomThaiNationalId.mjs

import { fileURLToPath } from 'node:url';

/** @returns {string} 13 digits, starting with 9 so it never clashes with the seeded accounts */
export function randomThaiNationalId() {
  const first12 = '9' + Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('');
  const sum = [...first12].reduce((acc, digit, i) => acc + Number(digit) * (13 - i), 0);
  return first12 + ((11 - (sum % 11)) % 10);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(randomThaiNationalId());
}
