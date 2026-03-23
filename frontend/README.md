# React + TypeScript + Vite

Esta plantilla proporciona una configuración mínima para hacer funcionar React en Vite con HMR y algunas reglas de ESLint.

Actualmente, hay dos plugins oficiales disponibles:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) usa [Babel](https://babeljs.io/) (u [oxc](https://oxc.rs) cuando se usa en [rolldown-vite](https://vite.dev/guide/rolldown)) para Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) usa [SWC](https://swc.rs/) para Fast Refresh

## Compilador de React

El Compilador de React no está habilitado en esta plantilla debido a su impacto en el rendimiento de desarrollo y construcción. Para añadirlo, consulta [esta documentación](https://react.dev/learn/react-compiler/installation).

## Ampliando la configuración de ESLint

Si estás desarrollando una aplicación de producción, recomendamos actualizar la configuración para habilitar reglas de linting conscientes de tipos:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Otras configuraciones...

      // Elimina tseslint.configs.recommended y reemplázalo con esto
      tseslint.configs.recommendedTypeChecked,
      // Alternativamente, usa esto para reglas más estrictas
      tseslint.configs.strictTypeChecked,
      // Opcionalmente, añade esto para reglas de estilo
      tseslint.configs.stylisticTypeChecked,

      // Otras configuraciones...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // otras opciones...
    },
  },
])
```

También puedes instalar [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) y [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) para reglas de linting específicas de React:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Otras configuraciones...
      // Habilita reglas de lint para React
      reactX.configs['recommended-typescript'],
      // Habilita reglas de lint para React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // otras opciones...
    },
  },
])
```
