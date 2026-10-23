import { EB_Garamond, Gentium_Plus, Cardo, GFS_Didot } from "next/font/google";
export const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin", "greek", "greek-ext"],
});
export const gentium = Gentium_Plus({
  variable: "--font-gentium",
  weight: ["400", "700"],
  subsets: ["latin", "greek", "greek-ext"],
  preload: false,
});
export const cardo = Cardo({
  variable: "--font-cardo",
  weight: ["400", "700"],
  subsets: ["latin", "greek", "greek-ext"],
  preload: false,
});
export const didot = GFS_Didot({
  variable: "--font-didot",
  weight: "400",
  subsets: ["latin", "greek", "greek-ext"],
  preload: false,
});
