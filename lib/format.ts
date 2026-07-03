// lib/format.ts
// Formatage d'affichage (euros). Isolé pour rester réutilisable côté UI et tests.

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const EUR_CENTS = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** « 1 234 € » — arrondi à l'euro, pour les montants annuels affichés en gros. */
export function formatEur(amount: number): string {
  return EUR.format(amount);
}

/** « 1 234,56 € » — au centime, pour le détail du calcul. */
export function formatEurCents(amount: number): string {
  return EUR_CENTS.format(amount);
}

/** « +1 234 € » / « −80 € » — signe explicite pour un gain/économie. */
export function formatSignedEur(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${formatEur(Math.abs(amount))}`;
}
