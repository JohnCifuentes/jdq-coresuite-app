# GitHub Copilot Instructions

These instructions define how to use Copilot effectively in this Angular workspace.
Use them to keep code consistent with existing architecture and avoid common regressions.

## Project Scope
- Project: `jdq-coresuite-app`
- Framework: Angular
- Main source: `src/app`
- Static assets: `public` and `src/assets`
- Environments: `src/environments`

## Core Principles
1. Reuse existing patterns before introducing new abstractions.
2. Prefer strongly typed code (interfaces, DTOs, explicit return types).
3. Keep components focused on UI behavior; move reusable logic to services/utils.
4. Keep routing and guards predictable to avoid navigation regressions.
5. Make minimal, targeted changes and avoid broad refactors unless requested.

## Recommended Workflow
1. Read related files first (component + template + service + model + routes).
2. Implement the smallest change that solves the request.
3. Verify imports, null safety, and strict typing.
4. Run tests after meaningful changes.
5. Summarize impact and affected files in the final response.

## Angular Conventions For This Repo
- Follow feature-based structure under `src/app/features`.
- Keep route definitions aligned with existing patterns in `app.routes.ts`.
- Use guards carefully and only redirect when behavior is explicitly required.
- Prefer `routerLink` for internal navigation links.
- Avoid using empty `href` values for app navigation.

## Guard And Routing Safety Notes
- Do not redirect all non-home routes by default from role guard logic.
- If redirect behavior is needed, scope it to the intended entry route only.
- Confirm that protected routes remain reachable for valid roles.

## Code Generation Guidance
- Components: generate structure, then adapt to local naming and module conventions.
- Services: keep API methods typed with request/response models.
- Models/DTOs: prefer explicit fields over `any`.
- Forms: use reactive forms patterns already present in related features.

## Quality Checklist Before Finishing
- No broken imports.
- No implicit `any` in new code.
- Template bindings match component API.
- Routing changes tested manually.
- `npm test` executed when changes are substantial.

## Security And Secrets
- Never hardcode tokens, credentials, or private endpoints.
- Use environment files and existing configuration patterns.
- Avoid logging sensitive payloads.

## Commit Message Guidance
- Use clear, scoped messages.
- Example: `feat(auth): improve reset password validation`
- Example: `fix(guards): restrict redirect logic to app root route`
