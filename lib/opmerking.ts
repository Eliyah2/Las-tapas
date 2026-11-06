/**
 * De gast typt sinds de review van sprint 2 één opmerking per gerecht: allergie
 * en wensen zitten in hetzelfde veld. Om een allergie op het keuken- en
 * uitserveerscherm toch te laten opvallen, herkennen we de bekende allergenen.
 *
 * Dit is alleen voor de weergave: de tekst wordt nooit aangepast en gaat
 * ongewijzigd naar de keuken.
 */
const PATROON =
  /\b(allergisch|allergie\w*|pinda\w*|noot|noten|gluten|melk|lactose\w*|eieren|schaaldieren|vis|soja|sesam|mosterd|selderij|sulfiet\w*)\b/i;

export function isAllergie(tekst?: string): boolean {
  if (!tekst) return false;
  return PATROON.test(tekst);
}
