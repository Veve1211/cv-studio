/** "14:05" – time of day in Czech format. */
export function formatTime(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}

/** "24. 11. 2026" – date in Czech format. */
export function formatDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });
}
