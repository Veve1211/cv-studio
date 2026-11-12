import { Fraunces, Inter, Inter_Tight, JetBrains_Mono, Manrope, Space_Grotesk } from "next/font/google";

// UI font
export const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

// Template fonts: only loaded when a template uses them, so no preload.
export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  preload: false,
});
export const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin", "latin-ext"], preload: false });
export const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "latin-ext"], preload: false });
export const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin", "latin-ext"], preload: false });
export const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin", "latin-ext"], preload: false });

export const fontVariables = [inter, fraunces, spaceGrotesk, manrope, interTight, jetbrainsMono]
  .map((f) => f.variable)
  .join(" ");
