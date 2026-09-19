# cPanel Deployment Guide - ODA Hotel Resort

## 📋 Pre-Deployment Checklist

- [ ] Project builds successfully locally: `npm run build`
- [ ] `.env` file contains all required variables
- [ ] Supabase database is configured and accessible
- [ ] Database migrations are applied
- [ ] Email service (Resend) API key is ready
- [ ] Payment processor (Chapa) is configured

## 🔧 Environment Variables Required

Create a `.env` file in your cPanel `/home/username/public_html` with:

```env
# Production environment
NODE_ENV=production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key

# Vite (Client-side)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-public-key

# Optional: Payment & Email
CHAPA_API_KEY=your-chapa-key
RESEND_API_KEY=your-resend-key

# Optional: Database
DATABASE_URL=your_database_connection_string
```

## 📦 Step 1: Build Application

On your local machine:

```bash
cd /home/sam/OdaHotelResort

# Clean previous build
rm -rf .output

# Build for production
npm run build

# Verify build succeeded
ls -la .output/server/index.mjs
# Should see: .output/server/index.mjs (exists ✓)
```

## 📤 Step 2: Upload to cPanel

### Option A: Using FTP/SFTP (Recommended for beginners)

1. Download an FTP client:
   - FileZilla (free)
   - WinSCP (Windows)
   - Cyberduck (Mac)

2. Connect with your cPanel credentials:
   - Host: `ftp://your-domain.com` or FTP hostname
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21 (FTP) or 22 (SFTP)

3. Navigate to `/public_html`

4. Create deployment package:
   ```bash
   # On your local machine
   cd /home/sam/OdaHotelResort
   tar -czf oda-hotel-prod.tar.gz .output package.json package-lock.json
   ```

5. Upload these files via FTP:
   - `oda-hotel-prod.tar.gz`
   - `.env` (with production values)

6. Extract on server via SSH or cPanel Terminal

### Option B: Using SSH (Faster for advanced users)

```bash
# SSH into your server
ssh username@your-domain.com

# Navigate to web root
cd public_html

# Clone repository (if using git)
git clone https://github.com/your-repo.git .
# Or upload via SCP
scp -r /home/sam/OdaHotelResort/.output username@your-domain.com:~/public_html/

# Setup dependencies
npm ci --production  # Install production deps only
npm run build        # Build again on server
```

### Option C: Using cPanel Git

1. Go to cPanel → Git Version Control
2. Clone your repository
3. Deploy branch
4. SSH into server and run:
   ```bash
   cd ~/public_html
   npm ci --production
   npm run build
   ```

## 🚀 Step 3: Configure Node.js in cPanel

### Access Node.js Manager

1. Login to cPanel
2. Find **Setup Node.js App** (or **Node.js Selector**)
3. Click **Create Application**

### Configure Application

Fill in these fields exactly:

| Field | Value |
|-------|-------|
| **Node.js version** | 18.x or 20.x |
| **Application root** | `/home/username/public_html` |
| **Application startup file** | `.output/server/index.mjs` |
| **Application URL** | `yourdomain.com` |
| **Port** | `3000` (or first available) |

Then click **Create**

### Add Environment Variables

1. After creation, click the app you just created
2. Scroll to **Environment Variables**
3. Add each variable from your `.env`:
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = `https://...`
   - `SUPABASE_KEY` = `...`
   - `VITE_SUPABASE_URL` = `https://...`
   - `VITE_SUPABASE_KEY` = `...`

4. Click **Save**

## 🔗 Step 4: Configure Reverse Proxy

If cPanel doesn't automatically create a proxy, create `.htaccess` in `/public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Allow static files through
  RewriteCond %{REQUEST_FILENAME} -s [OR]
  RewriteCond %{REQUEST_FILENAME} -l [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^.*$ - [NC,L]
  
  # Proxy everything else to Node.js app
  RewriteRule ^(.*)$ http://127.0.0.1:3000%{REQUEST_URI} [P,QSA,L]
</IfModule>

<IfModule mod_proxy.c>
  ProxyRequests Off
  ProxyPreserveHost On
  ProxyPassReverse / http://127.0.0.1:3000/
</IfModule>
```

Or in site-specific `.conf`:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
    
    DocumentRoot /home/username/public_html
</VirtualHost>
```

## 🛡️ Step 5: Set Up SSL/HTTPS

1. In cPanel, go to **AutoSSL** or **SSL/TLS Status**
2. Enable/Install SSL certificate
3. Force HTTPS via:

**Option A: .htaccess**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

**Option B: Via cPanel**
- Go to Force HTTPS Redirect
- Enable

## ▶️ Step 6: Start the Application

1. In cPanel Node.js App Manager
2. Click **Restart** button
3. Wait 30 seconds for application to start

## ✅ Step 7: Test & Verify

### Check Application Status

1. Go to cPanel Node.js App Manager
2. Look for green "Running" status
3. Check logs for errors (click app name to view)

### Test URLs

Visit in browser:
- `https://yourdomain.com` - Should load home page
- `https://yourdomain.com/menu` - Should load menu page
- `https://yourdomain.com/rooms` - Should load rooms page
- `https://yourdomain.com/admin` - Should load admin login

### Check Logs

In cPanel Node.js Manager:
1. Click your application name
2. Click **Logs**
3. Look for errors or "Server running" message

Via SSH:
```bash
tail -f ~/.pm2/logs/*.log
```

## 🔍 Troubleshooting

### "Port already in use"

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port in cPanel settings
```

### "Cannot find module"

```bash
# SSH into server
cd ~/public_html

# Reinstall dependencies
npm install
npm ci --production

# Rebuild
npm run build
```

### "Database connection error"

1. Verify `.env` variables are set correctly
2. Check Supabase project is accessible
3. Test connection:
   ```bash
   curl "https://your-supabase-url/rest/v1/" \
     -H "apikey: your-key"
   ```

### "Static files not loading"

- Verify `.output/public/assets/` exists
- Check `.htaccess` proxy rules
- Check `/public_html/.output/public/` permissions (755)

### "Application won't restart"

1. Check for syntax errors:
   ```bash
   node -c .output/server/index.mjs
   ```

2. Check disk space:
   ```bash
   df -h
   ```

3. Check memory:
   ```bash
   free -h
   ```

## 📊 Performance Optimization

### Enable Gzip Compression

In `.htaccess`:
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### Set Cache Headers

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

## 🔄 Continuous Deployment

### Using Git Hooks

Create `~/.git/hooks/post-receive`:

```bash
#!/bin/bash
cd ~/public_html
git reset --hard HEAD
npm ci --production
npm run build
pm2 restart all
```

### Manual Update Script

Create `/public_html/deploy.sh`:

```bash
#!/bin/bash
cd $(dirname "$0")
git pull origin main
npm ci --production
npm run build
touch .env  # Trigger app restart
```

Then SSH and run:
```bash
bash deploy.sh
```

## 📞 Support & Monitoring

Monitor your application:

```bash
# SSH into server
ssh username@domain.com

# Check app status
pm2 status

# View logs in real-time
pm2 logs

# Monitor resource usage
pm2 monit
```

## 🎯 Deployment Checklist (Final)

- [ ] `.env` file uploaded with production values
- [ ] Node.js v18+ installed in cPanel
- [ ] Application root set to `/home/username/public_html`
- [ ] Startup file set to `.output/server/index.mjs`
- [ ] Environment variables added in cPanel
- [ ] `.htaccess` reverse proxy configured
- [ ] SSL/HTTPS enabled
- [ ] Application restarted
- [ ] Home page loads at `https://yourdomain.com`
- [ ] Menu route works at `https://yourdomain.com/menu`
- [ ] Admin login accessible
- [ ] Database queries working

---

**Need Help?**
- cPanel Documentation: https://docs.cpanel.net/
- Node.js Hosting Guide: https://docs.cpanel.net/whm/feature-showcase/nodejs/
- TanStack Start Docs: https://tanstack.com/start
- Supabase Connection: https://supabase.com/docs
