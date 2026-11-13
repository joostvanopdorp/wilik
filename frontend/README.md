# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Localization

The frontend defaults to English, detects Dutch browser preferences, and lets users switch languages from the language selector. The choice is stored in `localStorage`. Keep English source phrases as translation keys and add their translations to `src/locales/nl.js`; untranslated keys fall back to English.

To add another language, create a locale module in `src/locales/`, import it in `src/I18nProvider.jsx`, and add its code and display name to the `languages` registry there. Add the same language to the `translations` registry. The language selector and document `lang` attribute are driven by that registry.
