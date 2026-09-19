# 🚀 QUICK DEPLOYMENT CHECKLIST - ODA HOTEL RESORT

## 📋 BEFORE YOU START

- [ ] You have cPanel access
- [ ] Node.js is available in your cPanel (check with hosting provider)
- [ ] You have SSH access (or strong FTP skills)
- [ ] You have Supabase project created
- [ ] You have your Supabase API keys ready

---

## ✅ LOCAL PREPARATION (Your Computer)

```bash
cd /home/sam/OdaHotelResort

# Step 1: Clean old builds
rm -rf .output

# Step 2: Install dependencies (if fresh install)
npm install

# Step 3: Build for production
npm run build

# Step 4: Verify build succeeded
ls -la .output/server/index.mjs
# Should show: .output/server/index.mjs (file exists ✓)

# Step 5: Package for upload
tar -czf oda-deploy.tar.gz .output package.json package-lock.json
```

---

## 📤 UPLOAD TO CPANEL

### Method 1: FTP Upload (Easiest)

1. Download FileZilla or WinSCP
2. Connect:
   - Host: `ftp.yourdomain.com` (or from cPanel/email)
   - User: `your_cpanel_username`
   - Pass: `your_cpanel_password`
3. Navigate to `/public_html`
4. Upload these files:
   - `oda-deploy.tar.gz` ← your build
   - `.env` ← environment variables
5. Extract `oda-deploy.tar.gz` in File Manager

### Method 2: SSH Upload (Faster)

```bash
# On your local machine
scp oda-deploy.tar.gz user@yourdomain.com:~/public_html/
scp .env user@yourdomain.com:~/public_html/

# SSH in
ssh user@yourdomain.com

# Navigate and extract
cd public_html
tar -xzf oda-deploy.tar.gz
rm oda-deploy.tar.gz

# Install production dependencies
npm ci --production
```

---

## ⚙️ CPANEL CONFIGURATION

### 1. Create .env File

Create a new text file `.env` in cPanel File Manager:

```
NODE_ENV=production
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_KEY=YOUR-ANON-KEY
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_KEY=YOUR-ANON-KEY
```

Get your keys from:
- Go to https://app.supabase.com
- Select your project
- Settings → API → Copy URL and anon public key

### 2. Setup Node.js App in cPanel

1. Open cPanel
2. Search for **"Node.js"** or **"Setup Node.js App"**
3. Click **Create Application**
4. Fill in the form:

   | Setting | Value |
   |---------|-------|
   | Node.js Version | 18.x or 20.x |
   | Application Root | `/home/YOUR_USERNAME/public_html` |
   | Application Startup File | `.output/server/index.mjs` |
   | Application URL | `yourdomain.com` |
   | Port | `3000` |

5. Click **Create**
6. When done, click on your app and add variables:
   - NODE_ENV = production
   - SUPABASE_URL = https://...
   - SUPABASE_KEY = ...
   - VITE_SUPABASE_URL = https://...
   - VITE_SUPABASE_KEY = ...

### 3. Configure Reverse Proxy

In cPanel File Manager, create/edit `.htaccess` in `/public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} -s [OR]
  RewriteCond %{REQUEST_FILENAME} -l [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^.*$ - [NC,L]
  RewriteRule ^(.*)$ http://127.0.0.1:3000%{REQUEST_URI} [P,QSA,L]
</IfModule>

<IfModule mod_proxy.c>
  ProxyRequests Off
  ProxyPreserveHost On
  ProxyPassReverse / http://127.0.0.1:3000/
</IfModule>
```

### 4. Enable SSL/HTTPS

1. In cPanel, go to **AutoSSL** or **SSL/TLS Status**
2. Issue certificate
3. In `.htaccess`, add:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

---

## 🎯 LAUNCH APPLICATION

### 1. Restart in cPanel

1. Go to Node.js App Manager
2. Click your app
3. Click **Restart** button
4. Wait 30 seconds

### 2. Verify It's Running

Check if you see:
- Status: **Green/Running** ✓
- No errors in logs

---

## ✨ TEST YOUR DEPLOYMENT

Open in browser and test these URLs:

- [ ] `https://yourdomain.com` → Should load home page
- [ ] `https://yourdomain.com/menu` → Should load menu page
- [ ] `https://yourdomain.com/rooms` → Should load rooms
- [ ] `https://yourdomain.com/admin` → Should load admin login
- [ ] `https://yourdomain.com/gallery` → Should load gallery

**All working?** 🎉 **SUCCESS!**

---

## 🚨 IF SOMETHING GOES WRONG

### App Won't Start

```bash
# SSH into server
ssh user@yourdomain.com
cd public_html

# Check what's wrong
cat .pm2/logs/*.log

# Try to rebuild
npm run build

# Restart
touch .env  # This triggers a restart
```

### Port Already in Use

```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

### Module Not Found

```bash
cd ~/public_html
npm install
npm ci --production
npm run build
```

### Database Connection Error

- [ ] Check SUPABASE_URL is correct
- [ ] Check SUPABASE_KEY is correct
- [ ] Check your Supabase project is active
- [ ] Test connection:

```bash
curl "https://YOUR-PROJECT.supabase.co/rest/v1/" \
  -H "apikey: YOUR-KEY"
```

---

## 📊 DEPLOYMENT SUMMARY

| Component | Location | Status |
|-----------|----------|--------|
| Source Code | `/home/user/public_html/.output/` | ✅ |
| Server Entry | `.output/server/index.mjs` | ✅ |
| Static Files | `.output/public/` | ✅ |
| Environment | `.env` file | ✅ |
| Node.js | Configured in cPanel | ✅ |
| HTTPS | SSL certificate active | ✅ |
| Proxy | `.htaccess` configured | ✅ |

---

## 📞 NEED MORE HELP?

- **cPanel Docs**: https://docs.cpanel.net/whm/feature-showcase/nodejs/
- **Detailed Guide**: See `CPANEL_DEPLOYMENT.md`
- **Project Structure**: See `DEPLOYMENT_STRUCTURE.md`
- **Supabase Help**: https://supabase.com/docs
- **TanStack Start**: https://tanstack.com/start

---

## 🔄 UPDATING THE APPLICATION

When you make changes locally:

```bash
# Build locally
npm run build

# Create new package
tar -czf oda-deploy.tar.gz .output package.json package-lock.json

# Upload same way as first time
# Replace existing .output folder
# Restart in cPanel
```

---

**Deployment Date**: _______________

**Server/Domain**: _______________

**Status**: [ ] Success [ ] In Progress [ ] Issues

**Notes**: ________________________________________________

---

*Last Updated: September 2026*
