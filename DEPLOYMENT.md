# Deployment Guide — Draft Document AI Agent

This guide covers two deployment paths and three knowledge base options.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Prepare the Project](#2-prepare-the-project)
3. [Knowledge Base Options](#3-knowledge-base-options)
4. [Deployment Option A — VPS + Docker Compose](#4-deployment-option-a--vps--docker-compose-recommended)
5. [Deployment Option B — Vercel + Render](#5-deployment-option-b--vercel--render)
6. [Add Authentication (Required for Public Sites)](#6-add-authentication-required-for-public-sites)
7. [Maintenance](#7-maintenance)

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| **OpenAI API key** | [platform.openai.com](https://platform.openai.com) |
| **Domain name** | Any registrar (Cloudflare, Namecheap, etc.) |
| **Git** | To push code to a remote repo |
| **Docker & Docker Compose** | Required for Option A |
| **Node.js 20+** | Required only for Option B (Vercel build) |

---

## 2. Prepare the Project

### 2.1 Push to GitHub

```bash
cd "d:\Users\bthcheung\Desktop\temp_working\Project_D"

git init
git add .
git commit -m "initial commit"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/draft-agent.git
git push -u origin main
```

### 2.2 Create the backend `.env` file

```bash
cp backend/.env.example backend/.env
```

**Never commit `backend/.env` to Git.** It is already listed in `.gitignore` (add it if not).

Add to `.gitignore` if missing:

```
backend/.env
backend/qdrant_data/
```

---

## 3. Knowledge Base Options

Choose one of the three modes and set it in `backend/.env`.

### Option A — Qdrant Cloud (Recommended for public deployments)

A managed, shared knowledge base — all environments read/write the same data.

**Free tier: 1 GB storage, no credit card required.**

1. Sign up at [cloud.qdrant.io](https://cloud.qdrant.io)
2. Create a cluster (select the region closest to your users)
3. Copy the **Cluster URL** and **API Key** from the cluster dashboard
4. Set in `backend/.env`:

```env
QDRANT_MODE=cloud
QDRANT_URL=https://xyz-123.eu-central.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-cloud-api-key
```

### Option B — Self-hosted Qdrant (inside Docker Compose)

Data lives on your own server. The `docker-compose.yml` already includes a Qdrant container.

```env
QDRANT_MODE=selfhosted
QDRANT_HOST=qdrant
QDRANT_PORT=6333
```

### Option C — Local file-based (development only)

```env
QDRANT_MODE=local
QDRANT_LOCAL_PATH=./qdrant_data
```

---

## 4. Deployment Option A — VPS + Docker Compose (Recommended)

**Best for:** full control, persistent data, self-hosted Qdrant or Qdrant Cloud.  
**Cost:** ~$6–20/month (Hetzner CX22, DigitalOcean Basic, AWS t3.small)

**Recommended providers:**

| Provider | Cheapest plan | Notes |
|---|---|---|
| [Hetzner Cloud](https://www.hetzner.com/cloud) | CX22 — €3.79/mo | Best value in Europe |
| [DigitalOcean](https://www.digitalocean.com) | Basic — $6/mo | Easy UI, good docs |
| [Linode / Akamai](https://www.linode.com) | Nanode — $5/mo | Reliable |
| [AWS EC2](https://aws.amazon.com/ec2) | t3.micro | Free tier 1 year |

---

### Step 1 — Provision a VPS

- OS: **Ubuntu 22.04 LTS**
- Min specs: **2 vCPU / 2 GB RAM / 20 GB SSD**
- Open firewall ports: **22** (SSH), **80** (HTTP), **443** (HTTPS)

### Step 2 — Install Docker on the VPS

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Install Docker
curl -fsSL https://get.docker.com | sh

# Verify
docker --version
docker compose version
```

### Step 3 — Point your domain to the VPS

In your domain registrar's DNS settings, add:

| Type | Name | Value |
|---|---|---|
| A | `@` | `YOUR_VPS_IP` |
| A | `www` | `YOUR_VPS_IP` |

Wait for DNS to propagate (usually 5–30 minutes).

### Step 4 — Get a free SSL certificate

```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

Certificates are saved to `/etc/letsencrypt/live/yourdomain.com/`.

### Step 5 — Add Nginx reverse proxy

Create the directory and config file on the VPS:

```bash
mkdir -p /app/nginx
nano /app/nginx/nginx.conf
```

Paste the following (replace `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # Frontend
    location / {
        proxy_pass         http://frontend:3000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass         http://backend:8000;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }

    # Health check
    location /health {
        proxy_pass http://backend:8000/health;
    }
}
```

Add the Nginx service to `docker-compose.yml` — insert before the `volumes:` line:

```yaml
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

### Step 6 — Configure environment variables

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Set at minimum:

```env
OPENAI_API_KEY=sk-...
QDRANT_MODE=cloud           # or selfhosted
QDRANT_URL=...              # if using Qdrant Cloud
QDRANT_API_KEY=...          # if using Qdrant Cloud
ALLOWED_ORIGINS=["https://yourdomain.com","https://www.yourdomain.com"]
```

### Step 7 — Clone and deploy

```bash
# On the VPS
git clone https://github.com/YOUR_USERNAME/draft-agent.git /app
cd /app
cp backend/.env.example backend/.env
nano backend/.env   # fill in values

docker compose up -d --build
```

### Step 8 — Verify

```bash
docker compose ps          # all containers should be "running"
docker compose logs -f     # watch logs
```

Visit `https://yourdomain.com` — the app should be live.

### Auto-renew SSL certificate

```bash
# Add a cron job to auto-renew
crontab -e
# Add this line:
0 3 * * * certbot renew --quiet && docker compose -f /app/docker-compose.yml restart nginx
```

---

## 5. Deployment Option B — Vercel + Render

**Best for:** zero server management, generous free tiers.  
**Cost:** Free tiers available; Render paid plan needed for persistent disk (~$7/mo).

### 5.1 Deploy the Backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Set:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Add a **Persistent Disk** (required if using `QDRANT_MODE=local`):
   - Mount path: `/app/qdrant_data`
   - Size: 1 GB (minimum)
5. Add environment variables in Render's dashboard:
   ```
   OPENAI_API_KEY=sk-...
   QDRANT_MODE=cloud            # recommended — avoids needing a persistent disk
   QDRANT_URL=...
   QDRANT_API_KEY=...
   ALLOWED_ORIGINS=["https://your-app.vercel.app"]
   ```
6. Deploy. Note your backend URL: `https://draft-agent-xxx.onrender.com`

### 5.2 Update the frontend rewrite

Edit `frontend/next.config.ts` to read the backend URL from an env var:

```ts
const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};
```

### 5.3 Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   ```
   BACKEND_URL=https://draft-agent-xxx.onrender.com
   ```
5. Deploy. Your site is live at `https://your-app.vercel.app`
6. Optionally add a custom domain in Vercel's dashboard.

---

## 6. Add Authentication (Required for Public Sites)

The `/admin` document upload page should not be publicly accessible without authentication.

### Quick option — HTTP Basic Auth via Nginx

Add to your `nginx.conf` inside the `server { ... }` block:

```nginx
location /admin {
    auth_basic           "Admin Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass           http://frontend:3000/admin;
}
```

Create the password file on the VPS:

```bash
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd adminuser
# Enter a strong password when prompted
docker compose restart nginx
```

### Production option — Auth0 / Azure AD

For enterprise deployments, integrate Auth0 or Azure AD:

1. Add the [NextAuth.js](https://next-auth.js.org) library to the frontend
2. Wrap `/admin` and `/api/*` routes with session guards
3. See the implementation roadmap in `Idea.md` (Phase 4)

---

## 7. Maintenance

### Update to a new version

```bash
# On the VPS
cd /app
git pull origin main
docker compose up -d --build
```

### Backup Qdrant data (self-hosted)

```bash
# Create a snapshot via the Qdrant REST API
curl -X POST http://localhost:6333/collections/documents/snapshots

# Copy the snapshot file off the server
docker cp $(docker compose ps -q qdrant):/qdrant/storage/snapshots ./backups/
```

If using **Qdrant Cloud**, snapshots are available in the cluster dashboard.

### View logs

```bash
docker compose logs backend -f    # backend logs
docker compose logs frontend -f   # frontend logs
docker compose logs qdrant -f     # knowledge base logs
```

### Restart a service

```bash
docker compose restart backend
```

### Stop everything

```bash
docker compose down          # keeps volumes (data safe)
docker compose down -v       # ⚠️ also deletes volumes (data lost)
```

---

## Environment Variable Reference

| Variable | Required | Example | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | `sk-...` | OpenAI API key |
| `LLM_MODEL` | | `gpt-4o` | Chat model |
| `EMBEDDING_MODEL` | | `text-embedding-3-small` | Embedding model |
| `QDRANT_MODE` | | `cloud` | `local` / `selfhosted` / `cloud` |
| `QDRANT_URL` | cloud only | `https://xyz.cloud.qdrant.io:6333` | Qdrant Cloud endpoint |
| `QDRANT_API_KEY` | cloud only | `abc123...` | Qdrant Cloud API key |
| `QDRANT_HOST` | selfhosted only | `qdrant` | Hostname of Qdrant container |
| `QDRANT_PORT` | selfhosted only | `6333` | Qdrant port |
| `QDRANT_COLLECTION_NAME` | | `documents` | Vector collection name |
| `ALLOWED_ORIGINS` | ✅ | `["https://yourdomain.com"]` | CORS allowed origins |
| `LLM_TEMPERATURE` | | `0.3` | Generation temperature (0–1) |
