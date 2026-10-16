# Contributing

zaly is a Bun workspace monorepo. Use Node.js 22.18.0 or newer and Bun.

## Development

Run from the repository root:

```sh
bun install --frozen-lockfile
bun z build
bun test                # Fast development loop
bun z test --bun        # Verify under both Node and Bun
bun z lint
bun z fmt
```

Use `bun z ...` for project tooling; running it inside a package limits supported
commands to that package. Root lint also requires `actionlint` on your PATH.

Keep changes focused and add tests for behavior changes. Import test APIs from
`vitest`, not `bun:test`, so tests work in both runtimes. Commit generated changes
when a build updates them. Use conventional commit messages such as `fix(tui): ...`
or `feat(agent): ...` for release notes.

## Documentation

Root `docs/` is for the user-facing documentation website. Package-specific
contributor and embedding guides live in `packages/<name>/docs/` where needed.

```sh
bun docs:dev       # Generate references and start VitePress
bun docs:build     # Regenerate references and check the production build/links
bun docs:preview   # Preview the production build
```

The five generated pages in `docs/reference/` come from `packages/dev/src/docs.ts`.
Edit their source definitions rather than the Markdown; run `bun docs:generate`
after changing settings, tool definitions, CLI arguments, or actions. Commit the
updated pages. Restart `docs:dev` or regenerate manually after source-definition
changes; VitePress watches Markdown, not the generator's inputs. `docs/nav.md` is
a planning document excluded from the website. Styling uses the default theme.

For versioning, CI publication, and recovery, see the
[release guide](./packages/dev/docs/releases.md). Versions and changelogs are managed
through release-please; don't bump package versions individually.
