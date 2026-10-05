import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as french from "@zxcvbn-ts/language-fr";

const evaluator = new ZxcvbnFactory({
  translations: french.translations,
  graphs: common.adjacencyGraphs,
  dictionary: { ...common.dictionary, ...french.dictionary },
});

export function passwordStrength(password: string) {
  if (!password || password.length > 64) return 0;
  return evaluator.check(password, ["geeckoscollector", "geeckos", "bougli", "pokemon"]).score;
}

export function passwordError(password: string) {
  if (password.length < 8 || password.length > 64) return "Le mot de passe doit contenir entre 8 et 64 caractères.";
  if (passwordStrength(password) < 3) return "Ce mot de passe est trop facile à deviner. Choisis une phrase plus longue avec plusieurs mots imprévisibles, ou un mot de passe généré.";
  return "";
}
