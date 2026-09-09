# Stacking Race

Offline schizolo race-betting game. See [`docs/spec-v1.md`](docs/spec-v1.md).

## pnpm requirement

pnpm is a prerequisite for running the app. This command is meant to download and run the Linux installation script:

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

But when I ran it, I found I had to add `~/.local/share/pnpm` to the path and then run again.

## Develop

```bash
pnpm install
pnpm typecheck
pnpm dev
```

Open the printed local URL (phone-portrait shell).

## Deploy

```bash
pnpm build
```
