const groups = [["àáâãäå", "a"], ["çćč", "c"], ["èéêë", "e"], ["ìíîï", "i"], ["ñń", "n"], ["òóôõöø", "o"], ["ùúûü", "u"], ["ýÿ", "y"], ["šś", "s"], ["žźż", "z"]] as const;
export const cardSearchFrom = groups.map(([letters]) => letters).join("");
export const cardSearchTo = groups.map(([letters, replacement]) => replacement.repeat(letters.length)).join("");
const replacements = Object.fromEntries(groups.flatMap(([letters, replacement]) => [...letters].map(letter => [letter, replacement])));
const accents = new RegExp("[" + cardSearchFrom + "]", "g");
export function normalizeCardSearch(text: string) {
  return text.toLowerCase().replace(/œ/g, "oe").replace(/æ/g, "ae").replace(/ß/g, "ss").replace(accents, letter => replacements[letter]);
}
