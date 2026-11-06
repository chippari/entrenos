// Demonstração temporária: a fonte e as cores da identidade visual valem só dentro de /demo (V3).
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import "./demo.css";

const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  weight: ["400", "700"],
  // Fonte de reserva: a sem serifa do sistema. O Next não tem as medidas desta fonte para ajustar a reserva.
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});

export default function LayoutDaDemo({ children }: LayoutProps<"/demo">) {
  return <div className={`demo ${atkinson.className}`}>{children}</div>;
}
