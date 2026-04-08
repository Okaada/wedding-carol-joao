## 1. Setup

- [x] 1.1 Install the `mongodb` npm package (`npm install mongodb`)
- [x] 1.2 Add `MONGODB_URI=` to `.env.local` (placeholder — fill in the Atlas connection string)

## 2. MongoDB Connection Helper

- [x] 2.1 Create `src/lib/mongodb.ts` with a singleton `MongoClient` that caches the client promise on `globalThis.__mongo` in development and as a module-level const in production, and throws a clear error if `MONGODB_URI` is not set

## 3. Update Server Action

- [x] 3.1 Rewrite `src/app/actions/rsvp.ts` to import the MongoDB helper, insert `{ name, cellphone, submittedAt }` into the `wedding.rsvps` collection, and remove all `fs` / file-path imports
- [x] 3.2 Remove `/data/rsvp.json` from `.gitignore`

## 4. Verify

- [x] 4.1 Submit the RSVP form and confirm a document appears in the Atlas `wedding.rsvps` collection with the correct fields
- [x] 4.2 Confirm that submitting with an empty name or cellphone still shows the Portuguese validation error and does not insert a document
