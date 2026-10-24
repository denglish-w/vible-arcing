# vible-arcing

A web app for studying the Greek New Testament: reading, grammatical (sentence) diagramming, and arcing/bracketing (discourse analysis) of the same passage in one place. See `PRODUCT.md` for who it is for.

The app is a Next.js server with two SQLite files: a read-only corpus store (`corpus.sqlite`, built from `corpus/v1/`) and your saved work (`app.sqlite`).

## Local only: read this first

There are no accounts. Anyone who can reach the server can read, change and delete all saved work. The server therefore binds to `127.0.0.1` and refuses requests whose `Host` is not `localhost`, `127.0.0.1` or `[::1]`.

To serve other machines anyway (for example on a trusted home network), set both variables when the server starts:

```sh
ALLOW_UNAUTHENTICATED_NETWORK=1 ALLOWED_HOSTS=myhost.local,192.168.1.20 BIND_ADDRESS=0.0.0.0 npm start
```

The server logs a warning at startup while this is on. Do not expose it to the internet.

## Running locally

Use the pinned Node (`fnm use`, reads `.node-version`).

```sh
npm install
npm run db:migrate   # create or upgrade data/app.sqlite (backs up first)
npm run db:seed      # build data/corpus.sqlite from corpus/v1/
npm run build
npm start            # http://127.0.0.1:3000
```

`npm run dev` starts the dev server on `127.0.0.1` instead of the last two steps. If your browser resolves `localhost` to IPv6 `::1` and cannot connect, open `http://127.0.0.1:3000`.

Data lives in `data/` by default. Set `DATA_DIR` to an absolute path to keep it elsewhere.

## Docker

```sh
docker build -t vible-arcing .
docker run -p 127.0.0.1:3000:3000 -v vible-data:/app/data vible-arcing
```

Publish the port on `127.0.0.1` as shown; the container itself listens on every interface. Running with `-p 3000:3000` (no `127.0.0.1:` prefix) exposes your saved work to every machine that can reach this computer, with no password. On start the container migrates `app.sqlite`, rebuilds the corpus store if it is missing or out of date, and only then starts the server. It stops if any step fails.

## Backup and restore

Before applying a pending schema migration, `db:migrate` (and so `npm start` and the container) writes a copy of `app.sqlite` to `data/backups/app-<UTC timestamp>.sqlite` and keeps the last five.

To restore:

1. Stop the server.
2. Copy the backup over the live file: `cp data/backups/app-<timestamp>.sqlite data/app.sqlite`, and delete any `data/app.sqlite-wal` and `data/app.sqlite-shm` left beside it.
3. Start the server again.

For Docker, do the same inside the `vible-data` volume (for example with `docker run --rm -v vible-data:/app/data -it vible-arcing sh`).

The corpus store needs no backup: `npm run db:seed` rebuilds it.

## Credits

The Greek text is the SBL Greek New Testament (SBLGNT), and morphology comes from MACULA Greek, both under CC BY 4.0. Full notices are on the app's `/credits` page and in `docs/reference/data-sources.md`.
