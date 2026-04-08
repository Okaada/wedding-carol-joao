## Context

The RSVP server action currently appends records to `data/rsvp.json` on the local filesystem. This is brittle: data is lost on redeploy, concurrent writes can corrupt the file, and there is no way to query or manage records without SSHing into the server. MongoDB Atlas is the target database — a free-tier cluster is sufficient for a wedding guest list.

## Goals / Non-Goals

**Goals:**
- Replace file I/O in the server action with a MongoDB Atlas insert
- Add a singleton MongoDB client helper (`src/lib/mongodb.ts`) that survives Next.js hot-reload
- Keep the RSVP form UX completely unchanged
- Store records in a collection named `rsvps` in a database named `wedding`

**Non-Goals:**
- Admin UI to view/manage RSVPs (future change)
- Duplicate detection or idempotency
- MercadoPago integration
- Schema validation beyond what the server action already does

## Decisions

### 1. Native `mongodb` driver over Mongoose
**Decision:** Use the official `mongodb` npm package directly, not Mongoose.

**Rationale:** No complex schemas or relationships are needed — just a single insert per RSVP. The raw driver is lighter, has no schema overhead, and avoids Mongoose's model-registration issues with Next.js hot-reload.

**Alternative considered:** Mongoose — rejected because it adds unnecessary abstraction for a single-document insert pattern.

### 2. Singleton client via module-level cache
**Decision:** Cache the `MongoClient` promise on the Node.js module (`globalThis.__mongo` in development, module-level `const` in production) to avoid creating a new connection per request.

**Rationale:** Next.js App Router Server Actions run in the same Node process. Without caching, every RSVP submission would open a new Atlas connection, quickly exhausting the free-tier connection limit.

### 3. Database `wedding`, collection `rsvps`
**Decision:** Hardcode the database and collection names in `src/lib/mongodb.ts`.

**Rationale:** There is only one database and one collection needed. Configuring them via env vars adds no benefit at this scale.

### 4. `MONGODB_URI` as the only required env var
**Decision:** Require only `MONGODB_URI` in `.env.local`. The connection string embeds credentials, host, and options.

**Rationale:** Standard Atlas connection string pattern. Simple to copy-paste from the Atlas dashboard.

## Risks / Trade-offs

- **[Cold start latency]** → First RSVP after a cold start waits for Atlas TCP handshake (~100–300 ms). Acceptable for a low-traffic wedding site.
- **[Atlas free-tier limits]** → 500 MB storage, 100 simultaneous connections. Well within range for a guest list of < 500.
- **[Missing MONGODB_URI in production]** → The server action will throw a runtime error if the env var is absent. Mitigation: fail fast with a clear error message in `src/lib/mongodb.ts`.
- **[Data migration]** → Existing `data/rsvp.json` entries (if any) are not automatically migrated. Manual migration instructions are in the migration plan.

## Migration Plan

1. Create a free-tier MongoDB Atlas cluster and obtain the connection string.
2. Add `MONGODB_URI=<connection-string>` to `.env.local` (and production env settings).
3. Deploy the updated code.
4. If `data/rsvp.json` has existing entries, manually insert them into the `wedding.rsvps` collection via Atlas UI or `mongoimport`.
5. **Rollback:** Revert `src/app/actions/rsvp.ts` to the file-based version and remove `MONGODB_URI`.
