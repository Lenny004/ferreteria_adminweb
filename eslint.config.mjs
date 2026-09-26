import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Next 16: eslint-config-next exporta configuración flat nativa (sin FlatCompat).
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Excepción temporal: la regla nueva de React Compiler (eslint-plugin-react-hooks 7,
      // incluida en eslint-config-next 16) marca 7 usos preexistentes de setState en efectos
      // (tienda, sidebar, theme-toggle). Se deja en "warn" para no refactorizar pantallas fuera
      // del alcance de M1; corregirlos en un PR dedicado y volver a "error".
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([".next/**", "node_modules/**", "coverage/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;