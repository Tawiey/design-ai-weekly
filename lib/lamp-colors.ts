// Curated palette for the lamp glow.
// Hues vary every page load to keep the experience feeling alive,
// but all stay in a saturation/lightness range that reads premium
// against the dark background and never harms title contrast.

export const LAMP_COLORS = [
  "hsl(238 84% 67%)", // Indigo
  "hsl(189 94% 60%)", // Cyan
  "hsl(316 73% 70%)", // Magenta
  "hsl(160 84% 60%)", // Emerald
  "hsl(38 92% 65%)",  // Amber
  "hsl(11 90% 70%)",  // Coral
] as const

export function pickRandomLampColor(): string {
  return LAMP_COLORS[Math.floor(Math.random() * LAMP_COLORS.length)]
}
