# MetricsMind - Self-Hosting with Docker + Nginx

This guide shows how to deploy the full stack (client, server, insights, Nginx) on a single VM using Docker Compose. MongoDB is recommended on Atlas.

## Prerequisites
- A Linux VM (Ubuntu recommended) with ports 80/443 open
- Docker and Docker Compose installed
- Domain DNS A record pointing to the VM (optional but recommended)
- MongoDB Atlas connection string (recommended)
- OPENAI API key (for `insights`)

## 1) Clone repo and set env
```bash
# On the server
git clone <your-repo-url> MetricsMind
cd MetricsMind

# Create .env next to docker-compose.yml based on env.example
# Required keys:
# MONGO_URI=your_atlas_uri
# JWT_SECRET=strong_secret
# OPENAI_API_KEY=sk-...
```

Notes:
- Client URLs are set at build time via `VITE_API_URL` and `VITE_INSIGHTS_URL`. In single-VM setup behind Nginx, you’ll access them on the same origin: `https://your-domain.com/api` and `https://your-domain.com/insights`.
- Backend uses `INSIGHTS_URL` to call insights service. In Compose this is internal (`http://insights:8000`) or via Nginx (`http(s)://<domain>/insights`). We keep it internal: `INSIGHTS_URL=http://insights:8000`.

## 2) Build the client for production
```bash
cd client
npm ci
npm run build
cd ..
```
This creates `client/dist` which will be served by Nginx.

## 3) Nginx production config
We include `nginx.prod.conf` which serves static files and proxies to backend and insights.
- `docker-compose.yml` mounts `nginx.prod.conf` to `/etc/nginx/nginx.conf`
- It also mounts `client/dist` to `/usr/share/nginx/html`

If you need to tweak routes, edit `nginx.prod.conf` and redeploy.

## 4) Using MongoDB Atlas (recommended)
- Set `MONGO_URI` in `.env` (replace the local `mongo` if you prefer)
- Optionally remove the `mongo` service from `docker-compose.yml`

## 5) Start services
```bash
docker compose up -d --build
docker compose ps
```
Visit: `http://<server-ip>` or your domain.

## 6) Add HTTPS (Let’s Encrypt)
Option A: Use a reverse proxy companion (e.g., nginx-proxy + acme-companion) — requires compose changes.

Option B (manual certbot inside container):
- Create a temporary shell in nginx container: `docker compose exec nginx sh`
- Install certbot (apk add certbot), request certs, and update nginx to listen on 443 with TLS.
- Renew periodically via cron.

Option C: Put a cloud Load Balancer in front that terminates TLS.

## 7) Environment variables summary
- Backend:
  - `NODE_ENV=production`
  - `MONGO_URI` (Atlas)
  - `JWT_SECRET` (strong secret)
  - `INSIGHTS_URL=http://insights:8000`
- Insights:
  - `NODE_ENV=production`
  - `OPENAI_API_KEY`
- Client (build-time):
  - `VITE_API_URL=https://your-domain.com/api`
  - `VITE_INSIGHTS_URL=https://your-domain.com/insights`

If you change the client URLs, rebuild the client.

## 8) Common operations
```bash
# View logs for a service
docker compose logs -f backend

# Rebuild after code changes
docker compose up -d --build

# Restart a service
docker compose restart nginx

# Stop everything
docker compose down
```

## 9) Troubleshooting
- 502/Bad Gateway from Nginx: ensure backend/insights are healthy and listening.
- Client 404 routes: ensure `nginx.prod.conf` uses SPA fallback (try_files -> index.html).
- CORS (if exposing APIs cross-origin): either serve client + API on same domain or configure CORS in the backend.
- Atlas connection: double-check IP allowlist and correct `MONGO_URI`.
