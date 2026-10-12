# Sandbox

Registry for Helen's standalone prototypes, including interview design
challenges, rapid product explorations, and client demos.

Portfolio projects that live under `helenhsong.com` are not tracked here.

Each prototype lives in this repository at `prototypes/<slug>/` as its own
page of one Vite app, and the home page lists every prototype as a link. The
`helen-prototype` skill sets the app up on first use.

- The site deploys to https://helenhsong.github.io/sandbox/ on every push to `main`.
- `projects.json` is the registry.
- `projects.schema.json` defines its format.
- New entries are normally added by the `helen-prototype` skill.


## Running it

```bash
npm install
npm run dev        # home page at /, each prototype at /<slug>/
npm run build      # type-checks, then builds every page into dist/
npm run typecheck
npm run lint
```

New prototypes start as a copy of `templates/prototype/`. They use the
`default` system from [`@helenhsong/ui`](https://github.com/helenhsong/ui)
unless their registry entry says otherwise.
