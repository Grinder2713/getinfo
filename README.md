# 🎯 Bank of America Honeypot - Scammer Data Collection

A sophisticated honeypot that displays a fake Bank of America security alert email while **secretly collecting comprehensive information** about visitors' devices, browsers, behavior, and interactions - **WITHOUT ANY USER ACTION REQUIRED**.

## 🚀 Quick Deploy

### Option 1: Render.com (Recommended - Free, Clean URLs)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com) and sign up (free)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `boa-security-alert` (or any name)
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Root Directory**: Leave empty (if files are in root)
     - **Plan**: Free
   - Click "Create Web Service"
   - Your URL: `https://boa-security-alert.onrender.com`

3. **Access Your Dashboard:**
   - Scammer View: `https://boa-security-alert.onrender.com/`
   - Admin Dashboard: `https://boa-security-alert.onrender.com/admin`
   - Download Data: `https://boa-security-alert.onrender.com/download`
   - API Endpoint: `https://boa-security-alert.onrender.com/admin/api`

### Option 2: Heroku

```bash
# Install Heroku CLI
heroku login
heroku create boa-security-alert
git push heroku main
# Your URL: https://boa-security-alert.herokuapp.com
```

### Option 3: Railway

1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Deploy automatically
4. Get instant URL

### Option 4: Fly.io

```bash
# Install flyctl
fly auth login
fly launch
fly deploy
```

## 📊 Features

### For Scammers (What They See)
- Authentic-looking Bank of America security alert email
- Professional design with BoA branding
- Mobile-responsive layout
- No visible tracking indicators

### For You (Admin Dashboard)
- **Real-time monitoring** at `/admin`
- **Auto-refresh** every 10 seconds
- **Comprehensive data collection**:
  - IP Address & Location
  - Device Type (Mobile/Tablet/Desktop)
  - Browser & OS Information
  - Screen Resolution & Display Details
  - Timezone & Language
  - Referrer URL
  - Hardware Information (CPU cores, touch points)
  - WebGL & Canvas Fingerprints
  - Browser Plugins
  - Mouse Movements
  - Scroll Behavior
  - Keyboard Events
  - Page Visibility Changes
- **Data Export**: Download all captured data as JSON
- **Live Stats**: See visitor counts and activity

## 🎯 Usage

1. **Deploy** using any method above
2. **Send link** to scammer: "I got this Bank of America fraud alert. Is this you? [YOUR-URL]"
3. **Monitor** at `https://your-url.com/admin` (updates every 10 seconds)
4. **Download** data at `https://your-url.com/download`
5. **Collect** all their information automatically!

## 📁 Project Structure

```
├── index.html          # Honeypot page (what scammers see)
├── admin.html          # Admin dashboard (your monitoring panel)
├── server.js           # Express server with data collection endpoints
├── package.json        # Node.js dependencies
├── Procfile           # Process file for deployment platforms
└── README.md          # This file
```

## 🔧 Configuration

### Port Configuration
The server uses `process.env.PORT` (automatically set by hosting platforms) or defaults to `3000`.

### Data Storage
All captured data is stored in `scammer_data.json` in JSON format. On Render's free tier, this file persists between deployments.

## 📡 API Endpoints

- `GET /` - Honeypot page (index.html)
- `GET /admin` - Admin dashboard
- `GET /admin/api` - JSON API for visitor data
- `GET /download` - Download all data as JSON file
- `GET /raw` - Raw JSON data
- `POST /log-visitor` - Log visitor information
- `POST /log-action` - Log user actions
- `POST /log-interaction` - Log interactions
- `POST /log-scroll` - Log scroll behavior
- `POST /log-mouse` - Log mouse movements
- `POST /log-keyboard` - Log keyboard events

## 🔒 What Gets Captured

When someone visits your link, you automatically collect:

### Device Information
- IP Address
- User Agent
- Device Type (Mobile/Tablet/Desktop)
- Operating System
- Browser Name & Version
- Screen Resolution
- Color Depth
- Orientation

### Behavioral Data
- Mouse Movements (tracked every 10 seconds)
- Scroll Behavior (tracked every 5 seconds)
- Keyboard Events
- Click Events
- Page Visibility Changes
- Time on Page

### Browser Fingerprinting
- Canvas Fingerprint
- WebGL Information
- Browser Plugins
- Hardware Concurrency (CPU cores)
- Touch Points
- Language & Timezone
- Referrer URL

### Network Information
- Connection Type (if available)
- Network Speed (if available)

## 🎨 Admin Dashboard Features

- **Live Statistics**: Real-time counts of visitors, actions, interactions
- **Visitor Details**: Comprehensive breakdown of each visitor
- **Auto-Refresh**: Updates every 10 seconds automatically
- **Data Export**: Download all captured data as JSON
- **Responsive Design**: Works on mobile and desktop
- **Clean Interface**: Easy to read and navigate

## 📱 Sample Captured Data

```json
{
  "type": "visitor",
  "data": {
    "timestamp": "2024-10-29T14:30:00.000Z",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
    "deviceType": "iPhone",
    "osName": "iOS",
    "browserName": "Safari",
    "browserVersion": "15.0",
    "screenWidth": 375,
    "screenHeight": 812,
    "isMobile": true,
    "language": "en-US",
    "timezone": "America/New_York",
    "referrer": "https://web.whatsapp.com/",
    "hardwareConcurrency": 6,
    "canvasFingerprint": "data:image/png;base64...",
    "webgl": {
      "vendor": "Apple Inc.",
      "renderer": "Apple GPU"
    }
  }
}
```

## 🚨 Server Console Output

When data is captured, you'll see in the server logs:

```
🎯 SCAMMER VISITED - COMPREHENSIVE DATA CAPTURED:
IP Address: 192.168.1.100
User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)
Device Type: iPhone
OS: iOS
Browser: Safari 15.0
Screen: 375x812
Mobile: true
Language: en-US
Timezone: America/New_York
Referrer: https://web.whatsapp.com/
Hardware Cores: 6
Touch Points: 5
WebGL: Available
Canvas Fingerprint: Captured
Plugins: 2
==========================================
```

## ⚠️ Legal Notice

This tool is for **educational and defensive purposes only**. Use responsibly and in accordance with local laws. Only use this on scammers who are already attempting to defraud you.

## 🎯 Pro Tips

1. **Make it personal**: "I got this email about someone trying to scam me. Is this you?"
2. **Be direct**: Don't be vague - ask them directly
3. **Monitor regularly**: Check the admin panel frequently
4. **Save the data**: Download the JSON file for evidence
5. **Share with authorities**: Collected data can help report scams

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Run locally
npm start

# Development with auto-reload
npm run dev

# Access locally
# - Honeypot: http://localhost:3000
# - Admin: http://localhost:3000/admin
```

## 📦 Dependencies

- **express**: Web server framework
- **nodemon**: Development auto-reload (dev dependency)

## 🌟 Features Highlights

✅ **Zero User Action Required** - Data collection starts immediately  
✅ **Comprehensive Fingerprinting** - Canvas, WebGL, hardware info  
✅ **Real-time Dashboard** - Auto-updates every 10 seconds  
✅ **Mobile Optimized** - Works perfectly on phones  
✅ **Professional Design** - Looks completely legitimate  
✅ **Data Export** - Download all captured information  
✅ **Free Hosting** - Works on Render, Railway, Heroku free tiers  

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Stay safe and catch those scammers!** 🔒
