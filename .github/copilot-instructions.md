# AI Agent Instructions for `jdq-coresuite-app`

This repository is a **standalone Angular 19** application generated with the CLI and configured for
**Server Side Rendering (SSR)**.  An AI coding agent should treat it as a minimal shell that will be
extended with new routes, components, and possibly Express endpoints.  The goal of this document is to
put the most important facts and patterns within easy reach so the agent can be productive without
wading through the entire Angular ecosystem every time.

---

### Architecture overview

* **Entry points**
  * `src/main.ts` – client bootstrap; calls `bootstrapApplication(AppComponent, appConfig)`.
  * `src/main.server.ts` – server bootstrap; exports a `bootstrap` factory used by `src/server.ts`.
  * `src/server.ts` – an Express application that hosts the rendered Angular app and any custom APIs.

* **Configuration**
  * `src/app/app.config.ts` contains the common `ApplicationConfig` providers used on the browser.
  * `src/app/app.config.server.ts` merges the common config with `provideServerRendering()`.
  * Providers such as `provideZoneChangeDetection` and `provideClientHydration` are already wired up.

* **Routing**
  * Routes are defined in `src/app/app.routes.ts`.  It is currently an empty array; add new
    entries here or using `ng generate component` and lazy-load them with the CLI.
  * `AppComponent` is standalone and only imports `RouterOutlet`.

* **Styling & assets**
  * Global styles live in `src/styles.scss`; individual component styles in `.scss` files next to the
    component.  The CLI is configured to look for assets in the `public/` folder.

* **SSR details**
  * The Angular build configuration (`angular.json`) includes `server: "src/main.server.ts"` and
    `ssr.entry: "src/server.ts"`.
  * `npm run serve:ssr:jdq-coresuite-app` will start the compiled Node server from
    `dist/jdq-coresuite-app/server/server.mjs` on port 4000 by default.
  * Add or uncomment Express routes in `src/server.ts` **above** the static‑file handler.  Example
    comment is already provided.
  * `isMainModule(import.meta.url)` guard prevents the server from starting when the file is
    imported by the SSR engine during `ng build`.

---

### Common developer workflows

```bash
npm install           # bootstrap dependencies
npm run start         # angular dev server (ng serve) at http://localhost:4200
npm run build         # production build into dist/
npm run watch         # rebuild with `--watch` in development
npm run test          # run Karma unit tests
# SSR build steps (CLI provides targets):
ng build --configuration production
ng run jdq-coresuite-app:server --configuration production  # produces server bundle
npm run serve:ssr:jdq-coresuite-app  # start the SSR Express server
``` 


the `ng` prefix is available via the `scripts` section of `package.json`.  Most changes are
performed with the Angular CLI (`ng generate component`, `ng lint`, etc.) rather than manually
editing configuration files.

### Project conventions and patterns

* The repository uses **standalone components**; there are no `NgModule` classes anywhere.  Always
  prefer `bootstrapApplication()` when adding new bootstrap code and include component-specific
  imports in the `@Component` decorator `imports` array.
* Routing is centralized but lazy loading is encouraged for feature modules.  The CLI command
  `ng generate component name --route name --module app.routes.ts` works with standalone routing.
* Tests are written with Jasmine/Karma.  Only one spec file exists (`app.component.spec.ts`) but
  new tests should follow Angular's standard pattern (create a `TestBed` or use `standalone: true`).
* To modify server behaviour (API paths, middleware), edit `src/server.ts`.  Keep build-related logic
  out of that file; Angular CLI handles compilation.

### Integration points & external dependencies

* Core Angular packages (`@angular/*`) are pegged to `^19.0.0`; update them together.
* The only runtime extra dependency is `express` (with `@types/express` for development) used by the
  SSR server.  No other backend services are referenced.
* Client hydration and zone coalescing are enabled via `provideClientHydration(withEventReplay())` and
  `provideZoneChangeDetection({ eventCoalescing: true })` respectively; do not remove them without
  understanding the SSR/hydration implications.

### Tips for AI agents

1. **Look at the manifests** (`package.json`, `angular.json`) first to understand available scripts and
   architect targets.
2. **Modify `app.routes.ts`** when adding pages; ensure the components used are standalone.
3. **When editing server-side logic**, keep API endpoints ahead of the catch‑all `app.get('**', ...)`
   handler and restart the SSR server after rebuilding.
4. **Large changes** (new modules, libraries) are normally done with `ng generate` so that CLI
   schematic metadata stays consistent.
5. **Watch for configuration merge**: client vs server configs are merged in
   `app.config.server.ts` – duplicating providers may lead to hard‑to‑debug issues.

---

> This file was generated by an AI agent and should be updated if the project evolves.  If any
> instructions are unclear or missing, please flag them for review.