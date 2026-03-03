# GitHub Copilot Instructions

This document provides guidelines for using GitHub Copilot within the `jdq-coresuite-app` Angular project. Follow these tips to get the most out of Copilot while contributing to or maintaining the codebase.

## 🚀 Getting Started
1. **Enable Copilot** in your IDE (VS Code) and ensure you're signed in with GitHub.
2. Place your cursor in a `.ts`, `.html`, `.scss`, or `.json` file to trigger suggestions.
3. For full project context, open multiple related files (e.g., component + service + model) before coding.

## 🧱 Project Structure Overview
- **src/app**: main application code (components, services, models, guards, layouts). Use Copilot to scaffold new components or services based on existing patterns.
- **src/environments**: configuration for different builds. Copilot can help generate new environment entries.
- **public**: static assets and styles.

## 📝 Best Practices with Copilot
- **Review every suggestion**: Copilot is a helper, not an authority. Verify logic and adherence to project conventions.
- **Leverage existing patterns**: When generating code, reference existing modules (e.g., `auth`, `dashboard`, `marketing`) to maintain consistency.
- **Use detailed comments or TODOs** to prompt Copilot for more accurate code snippets.

## 🔧 Common Tasks
- **Creating new components**: Use Angular CLI, then rely on Copilot for implementing complex logic or forms.
- **Services and models**: Provide type annotations and interfaces; Copilot will suggest method signatures or HTTP calls.
- **Routing & Guards**: Copilot can suggest route configurations or guard conditions based on examples in `app.routes.ts` and `role.guard.ts`.

## 🧹 Code Quality
- Always run `npm test` after significant changes, and inspect Copilot suggestions for formatting and imports.
- Use the project's ESLint/TSLint config (if available); Copilot often respects lint rules but double-check.

## ⚠️ Warnings
- Be cautious with auto-generated HTML/CSS; review for responsive and accessibility compliance.
- When using Copilot with environment variables or API keys, ensure sensitive data is not committed.

## 📁 Commit Message Tips
- Mention Copilot when a commit includes significant suggestions (e.g., "docs: added new footer component via Copilot").

Happy coding! 🎉
