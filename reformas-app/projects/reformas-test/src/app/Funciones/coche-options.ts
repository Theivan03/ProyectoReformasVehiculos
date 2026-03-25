export const COCHE_OPTION_TEXTS = [
  'El vehículo dispone de sistema de frenado ABS.',
  'Se cumple en todo caso con la normativa de salientes exteriores.',
  'Los anclajes del paragolpes delantero son los originales, no modificándose la altura libre.',
  'El sistema de remolcado delantero y trasero no se ve impedido tras la reforma.',
  'Ninguna pieza asociada a las reformas presenta aristas vivas o cortantes peligrosas.',
];

export function getCocheOptionTexts(opcionesCoche: unknown): string[] {
  if (!Array.isArray(opcionesCoche)) {
    return [];
  }

  return COCHE_OPTION_TEXTS.filter((_, index) => Boolean(opcionesCoche[index]));
}
