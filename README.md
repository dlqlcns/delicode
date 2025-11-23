# Delicode backend

A lightweight Node.js server that serves the static frontend from `public/` and exposes REST APIs backed by Supabase.

## Running locally

```
SUPABASE_URL=<your-supabase-url> \
SUPABASE_KEY=<your-service-role-key> \
PORT=3000 \
node src/server.js
```

The frontend is available at `http://localhost:3000/` and API routes are namespaced under `/api`.
