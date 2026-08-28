# ShipReady

ShipReady is a frontend release-readiness application built with Next.js.

The product goal is to help a Frontend Engineer or Tech Lead answer:

> Is this frontend release ready to ship?

At the current stage, the repository contains the production-style project bootstrap, local quality checks, CI, Vercel Production deployment, and Preview deployments for pull requests.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- npm
- Vitest
- React Testing Library
- GitHub Actions
- Vercel

## Requirements

Node.js version:

```text
24.20.0
```

The expected version is pinned in `.nvmrc`.

## Local Development

Install dependencies:

```powershell
npm ci
```

Start the development server:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

## Quality Checks

Lint:

```powershell
npm run lint
```

Typecheck:

```powershell
npm run typecheck
```

Tests:

```powershell
npm run test
```

Production build:

```powershell
npm run build
```

## CI

GitHub Actions runs on:

- pushes to `main`
- pull requests targeting `main`

The CI pipeline runs:

```text
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

The `main` branch is protected and requires the `quality` status check to pass before merge.

## Deployment

Vercel is connected to the GitHub repository.

- `main` -> Production
- pull requests / branches -> Preview deployments

## Git Workflow

```text
task
|
v
branch
|
v
implementation
|
v
tests
|
v
pull request
|
v
CI
|
v
Preview
|
v
merge
```

`main` is the technical source of truth for production code.
