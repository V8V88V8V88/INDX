# Contributing to INDX

Thanks for helping out. Bug fixes, data corrections, translations and new features are all welcome.

## Before you start

- Look through the [open issues](https://github.com/V8V88V8V88/INDX/issues) first. If you want to take one, comment on it so two people don't do the same work.
- For anything big (a new page, a new dataset, a large refactor), open an issue and talk it through before writing code.
- Issues labelled `good first issue` are a good place to begin.

## Setup

You need [Bun](https://bun.sh) and Python 3.

```bash
git clone https://github.com/<your-username>/INDX.git
cd INDX
bun install
bun run dev
```

Open http://localhost:3000.

## Making a change

1. Create a branch from `main` (`fix-district-search`, `add-nfhs-data`, and so on).
2. Keep each pull request to one change. Several small PRs are easier to review than one big one.
3. Match the style of the code around you. Use the shared components in `src/components/ui` instead of new one-off styles.
4. Run the checks before you push:

   ```bash
   bun run lint
   bun run typecheck
   bun run check:data
   bun run build
   ```

   CI runs the same checks on every pull request, and a PR can't be merged while they fail.

## Data changes

- Every number needs a source. Prefer official sources (Census, MoSPI, RGI, NFHS, ministries) and mention the source and year in your PR.
- Generated data is rebuilt by `scripts/data/build_data.py`. Change the script or the files in `scripts/data/sources/`, not the generated output. See [`scripts/data/README.md`](scripts/data/README.md).
- If you find a wrong number but can't fix it, [report it](https://github.com/V8V88V8V88/INDX/issues/new?template=data-error.yml) with the place, the value you see, and where the correct value comes from.

## Translations

All interface text lives in `messages/<language>.json`. English (`en.json`) is the reference.

- **Fixing a translation:** edit the value in that language's file. Keep the keys and anything in `{curly braces}` exactly as they are.
- **Adding text to the site:** add the English text to `en.json`, use it with `useTranslations`, and add the same key to every other language file (an English placeholder is fine, a native speaker can translate it later).
- **Adding a language:** copy `en.json` to `messages/<code>.json`, translate it, and add the language to `LOCALES` in `src/i18n/routing.ts`.
- District and city names come from Wikidata through the data build, not from these files.

`bun run check:i18n` reports missing keys and broken placeholders.

## Commits and pull requests

- Write commit messages in the imperative, in plain English: `Fix district search on mobile`, not `fixed stuff`.
- In the PR description, say what changed and why, and add screenshots for anything visual (light and dark theme, desktop and mobile).
- Link the issue it closes (`Closes #12`).

## Using AI tools

You can use any tools you like, AI included. There's no need to mention them, add co-author lines or labels.

What matters is that **you** are responsible for every line in your PR:

- Read and understand all of it. You should be able to explain any change if asked.
- Run it and check it actually works in the browser, not just that it compiles.
- Check every number and source yourself. Don't submit data you haven't verified.

PRs that are clearly unreviewed, don't work, or contain made-up data will be closed.

## Code of conduct

Be kind and respectful. Disagree about ideas, never attack people. Harassment of any kind is not tolerated.

## License

By contributing, you agree that your contributions are licensed under the [AGPL-3.0](LICENSE).
