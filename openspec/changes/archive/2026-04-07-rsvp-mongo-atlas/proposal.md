## Why

The current RSVP implementation writes submissions to a local `data/rsvp.json` file, which is lost every time the server redeploys and is not safely accessible. MongoDB Atlas provides a managed, cloud-hosted database so RSVP records are durable, queryable, and accessible from anywhere.

## What Changes

- Replace the `fs.appendFileSync` file persistence in `src/app/actions/rsvp.ts` with an insert into a MongoDB Atlas collection
- Add a `src/lib/mongodb.ts` connection helper that reuses the client across requests (hot-reload safe)
- Add the `mongodb` npm package as a dependency
- Add `MONGODB_URI` environment variable (connection string from Atlas)
- Remove `data/rsvp.json` from `.gitignore` (no longer needed)
- **BREAKING**: `data/rsvp.json` is no longer used; existing entries (if any) should be migrated manually

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `guest-rsvp`: Persistence requirement changes — submissions are now stored in MongoDB Atlas instead of a local NDJSON file

## Impact

- `src/app/actions/rsvp.ts` — replace file I/O with MongoDB insert
- `src/lib/mongodb.ts` — new connection helper (singleton client)
- `package.json` — add `mongodb` dependency
- `.env.local` — add `MONGODB_URI`
- `.gitignore` — remove `/data/rsvp.json` entry
