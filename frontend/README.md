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

The UI is available in English and Dutch. Which language someone sees is decided in this order:

1. Their own choice in Settings or in the language button, stored per browser in `localStorage`.
2. The default language an admin picks in the admin panel.
3. The browser's preferred languages. Anything that isn't available falls back to English.

Texts are written in English and passed through `t()`, with the English text itself as the key, for example `t('Save')`. Dutch translations live in `src/locales/nl.js`. A text without a translation is shown in English. Error messages from the backend are translated the same way, with the backend's English message as the key.

`node scripts/check-translations.mjs` (run from the repo root, and in CI) checks that every text goes through `t()`, that every key has a Dutch translation, and that `nl.js` has no unused keys.

You don't need to speak Dutch to contribute. Wrap new text in `t()` and leave `nl.js` alone. A missing Dutch translation only shows up as a warning on your pull request, and a maintainer adds it. Until then the app shows your English text.

To add another language:

1. Create a locale module in `src/locales/`, like `nl.js`.
2. In `src/I18nProvider.jsx`, import it and add the language to both the `languages` and the `translations` registries.
3. Add its code to `LANGUAGE_OPTIONS` in `backend/helpers.py`, so admins can pick it as the default.
