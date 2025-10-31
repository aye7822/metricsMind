# Deploy MetricsMind on Render with Docker + Nginx

This guide shows how to deploy MetricsMind on Render using Docker containers with Nginx.

## Architecture Options

### Option 1: Separate Services (Recommended)
- **Client**: Static Site (no Docker needed)
- **Server**: Docker Web Service
- **Insights**: Docker Web Service
- No Nginx needed (Render handles routing)

### Option 2: Single Nginx Docker Container (This Guide)
- **Client + Nginx**: Docker Web Service (serves static files + proxies)
- **Server**: Docker Web Service
- **Insights**: Docker Web Service

**Note**: Render doesn't support docker-compose networking. Services communicate via public HTTPS URLs.

---

## Prerequisites
- GitHub repository with all code
- MongoDB Atlas connection string
- OpenAI API key
- Render account

---

## Step 1: Prepare Production Dockerfiles

### 1.1 Update Server Dockerfile for Production
The server Dockerfile should build and run in production mode.

### 1.2 Update Insights Dockerfile for Production
Same as server - production build.

### 1.3 Create Nginx Dockerfile
A new Dockerfile that:
- Builds the React client
- Copies static files to Nginx
- Configures Nginx to serve static files and proxy to backend/insights

---

## Step 2: Deploy Backend (Server) Service

1. **Create New Web Service** on Render
2. **Settings**:
   - **Name**: `metricsmind-backend`
   - **Root Directory**: `server`
   - **Runtime**: Docker
   - **Port**: Use Render's `$PORT` (automatically assigned)
   - **Build Command**: (auto-detected from Dockerfile)
   - **Start Command**: (auto-detected from Dockerfile)

3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/saasmetrics?retryWrites=true&w=majority
   JWT_SECRET=your-strong-secret-here
   INSIGHTS_URL=https://your-insights-service.onrender.com/insights
   ```

4. **Note the service URL**: `https://your-backend-service.onrender.com`

---

## Step 3: Deploy Insights Service

1. **Create New Web Service**
2. **Settings**:
   - **Name**: `metricsmind-insights`
   - **Root Directory**: `insights`
   - **Runtime**: Docker
   - **Port**: Use Render's `$PORT`

3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   OPENAI_API_KEY=sk-your-api-key
   ```

4. **Note the service URL**: `https://your-insights-service.onrender.com`

---

## Step 4: Deploy Client + Nginx Service

1. **Create New Web Service**
2. **Settings**:
   - **Name**: `metricsmind-client`
   - **Root Directory**: `client`
   - **Runtime**: Docker
   - **Port**: Use Render's `$PORT`

3. **Environment Variables** (Build-time):
   ```
   VITE_API_URL=https://your-backend-service.onrender.com/api
   VITE_INSIGHTS_URL=https://your-insights-service.onrender.com/insights
   ```

4. **Important**: The Nginx Dockerfile will:
   - Build the React app with these env vars
   - Copy `dist/` to Nginx html directory
   - Configure Nginx to serve static files and proxy `/api` and `/insights`

---

## Step 5: Update Dockerfiles

### Server Dockerfile (Production)
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE $PORT

CMD ["node", "server.js"]
```

### Insights Dockerfile (Production)
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE $PORT

CMD ["node", "server.js"]
```

### Client + Nginx Dockerfile (New)
Create `client/Dockerfile.nginx`:
```dockerfile
# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_INSIGHTS_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_INSIGHTS_URL=$VITE_INSIGHTS_URL

RUN npm run build

# Stage 2: Nginx
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config
COPY nginx.render.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Step 6: Create Nginx Config for Render

Create `client/nginx.render.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    gzip on;
    gzip_comp_level 5;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        # Cache static assets
        location ~* \.(?:js|css|png|jpg|jpeg|gif|svg|ico)$ {
            expires 30d;
            add_header Cache-Control "public, max-age=2592000, immutable";
        }

        # SPA fallback
        location / {
            try_files $uri /index.html;
        }

        # API proxy to backend service
        location /api/ {
            proxy_pass https://your-backend-service.onrender.com;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Insights proxy
        location /insights/ {
            proxy_pass https://your-insights-service.onrender.com/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

**⚠️ Important**: Replace `your-backend-service.onrender.com` and `your-insights-service.onrender.com` with your actual Render service URLs. You can also use environment variables with a startup script.

---

## Step 7: Update Server to Use Render PORT

Make sure `server/server.js` uses:
```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

Same for `insights/server.js`.

---

## Step 8: Deploy Order

1. Deploy **Backend** first → Get URL
2. Deploy **Insights** → Get URL  
3. Update backend's `INSIGHTS_URL` env var with insights URL
4. Deploy **Client + Nginx** with backend/insights URLs in env vars and nginx config

---

## Step 9: Environment Variables Summary

### Backend Service
- `NODE_ENV=production`
- `PORT=10000` (or let Render assign)
- `MONGO_URI=your-atlas-uri`
- `JWT_SECRET=strong-secret`
- `INSIGHTS_URL=https://your-insights.onrender.com/insights`

### Insights Service
- `NODE_ENV=production`
- `PORT=10000`
- `OPENAI_API_KEY=sk-...`

### Client + Nginx Service
- `VITE_API_URL=https://your-backend.onrender.com/api`
- `VITE_INSIGHTS_URL=https://your-insights.onrender.com/insights`

---

## Step 10: Custom Domain (Optional)

1. Go to each service → Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed
4. Update environment variables with custom domain URLs

---

## Troubleshooting

### 502 Bad Gateway
- Check backend/insights services are running
- Verify URLs in Nginx config match actual Render service URLs
- Check logs: `render.com` → Your service → Logs

### CORS Errors
- Add CORS middleware in backend allowing your client domain
- Or serve everything from same domain (Nginx approach handles this)

### Static Files Not Loading
- Ensure client Dockerfile builds successfully
- Check `dist/` folder exists after build
- Verify Nginx config serves from `/usr/share/nginx/html`

### API Calls Failing
- Verify environment variables are set correctly
- Check Nginx proxy_pass URLs are correct
- Ensure backend/insights services are accessible

---

## Alternative: Dynamic Nginx Config

Instead of hardcoding URLs, use a startup script that generates nginx.conf:

Create `client/start-nginx.sh`:
```bash
#!/bin/sh
envsubst '$$BACKEND_URL $$INSIGHTS_URL' < /etc/nginx/nginx.template.conf > /etc/nginx/nginx.conf
nginx -g 'daemon off;'
```

Then use environment variables in Render for `BACKEND_URL` and `INSIGHTS_URL`.

---

## Cost Considerations

- **Free tier**: Services spin down after 15min of inactivity
- **Starter tier**: $7/month per service (always on)
- With 3 services (client, server, insights), expect ~$21/month for always-on

Consider using Render's Static Site for client (free) and only Docker for backend/insights if budget is a concern.

