const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Log file path
const LOG_FILE = 'scammer_data.json';

// Initialize log file if it doesn't exist
if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
}

// Helper function to get client IP
function getClientIP(req) {
    let ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // Handle comma-separated IPs (from proxy)
    if (ip && ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }
    
    // Remove IPv6 prefix if present
    if (ip && ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }
    
    return ip;
}

// Helper function to get geolocation from IP
function getGeolocation(ip) {
    return new Promise((resolve) => {
        // Skip if IP is localhost or invalid
        if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            resolve(null);
            return;
        }
        
        // Use ip-api.com (free, no API key required)
        const url = `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;
        
        http.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const geo = JSON.parse(data);
                    if (geo.status === 'success') {
                        resolve({
                            country: geo.country,
                            region: geo.regionName,
                            city: geo.city,
                            zip: geo.zip,
                            latitude: geo.lat,
                            longitude: geo.lon,
                            timezone: geo.timezone,
                            isp: geo.isp,
                            org: geo.org,
                            as: geo.as
                        });
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.error('Error parsing geolocation:', error);
                    resolve(null);
                }
            });
        }).on('error', (error) => {
            console.error('Error fetching geolocation:', error);
            resolve(null);
        });
    });
}

// Helper function to log data
function logData(data) {
    try {
        const existingData = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
        existingData.push(data);
        fs.writeFileSync(LOG_FILE, JSON.stringify(existingData, null, 2));
        console.log('Data logged:', new Date().toISOString());
    } catch (error) {
        console.error('Error logging data:', error);
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Log visitor information (COMPREHENSIVE DATA COLLECTION)
app.post('/log-visitor', async (req, res) => {
    const ip = getClientIP(req);
    const visitorData = {
        ...req.body,
        ip: ip,
        headers: req.headers,
        timestamp: new Date().toISOString()
    };
    
    // Get geolocation data
    const geolocation = await getGeolocation(ip);
    if (geolocation) {
        visitorData.location = geolocation;
    }
    
    logData({
        type: 'visitor',
        data: visitorData
    });
    
    console.log('🎯 SCAMMER VISITED - COMPREHENSIVE DATA CAPTURED:');
    console.log('IP Address:', visitorData.ip);
    if (geolocation) {
        console.log('📍 Location:', `${geolocation.city}, ${geolocation.region}, ${geolocation.country}`);
        console.log('📍 Coordinates:', `${geolocation.latitude}, ${geolocation.longitude}`);
        console.log('📍 ISP:', geolocation.isp);
    }
    console.log('User Agent:', visitorData.userAgent);
    console.log('Device Type:', visitorData.deviceType);
    console.log('OS:', visitorData.osName);
    console.log('Browser:', visitorData.browserName, visitorData.browserVersion);
    console.log('Screen:', visitorData.screenWidth + 'x' + visitorData.screenHeight);
    console.log('Mobile:', visitorData.isMobile);
    console.log('Tablet:', visitorData.isTablet);
    console.log('Desktop:', visitorData.isDesktop);
    console.log('Language:', visitorData.language);
    console.log('Timezone:', visitorData.timezone);
    console.log('Referrer:', visitorData.referrer);
    console.log('Hardware Cores:', visitorData.hardwareConcurrency);
    console.log('Touch Points:', visitorData.maxTouchPoints);
    console.log('WebGL:', visitorData.webgl ? 'Available' : 'Not Available');
    console.log('Canvas Fingerprint:', visitorData.canvasFingerprint ? 'Captured' : 'Not Available');
    console.log('Plugins:', visitorData.plugins ? visitorData.plugins.length : 0);
    console.log('==========================================');
    
    res.json({ status: 'success' });
});

// Log user actions
app.post('/log-action', (req, res) => {
    const actionData = {
        ...req.body,
        ip: getClientIP(req),
        timestamp: new Date().toISOString()
    };
    
    logData({
        type: 'action',
        data: actionData
    });
    
    console.log('📱 USER ACTION:', actionData.action);
    
    res.json({ status: 'success' });
});

// Log interactions
app.post('/log-interaction', (req, res) => {
    const interactionData = {
        ...req.body,
        ip: getClientIP(req),
        timestamp: new Date().toISOString()
    };
    
    logData({
        type: 'interaction',
        data: interactionData
    });
    
    res.json({ status: 'success' });
});

// Log visibility changes
app.post('/log-visibility', (req, res) => {
    const visibilityData = {
        ...req.body,
        ip: getClientIP(req),
        timestamp: new Date().toISOString()
    };
    
    logData({
        type: 'visibility',
        data: visibilityData
    });
    
    res.json({ status: 'success' });
});

// Log scroll behavior
app.post('/log-scroll', (req, res) => {
    const scrollData = {
        ...req.body,
        ip: getClientIP(req),
        timestamp: new Date().toISOString()
    };
    
    logData({
        type: 'scroll',
        data: scrollData
    });
    
    res.json({ status: 'success' });
});

// Log mouse movements
app.post('/log-mouse', (req, res) => {
    const mouseData = {
        ...req.body,
        ip: getClientIP(req),
        timestamp: new Date().toISOString()
    };
    
    logData({
        type: 'mouse',
        data: mouseData
    });
    
    res.json({ status: 'success' });
});

// Log keyboard events
app.post('/log-keyboard', (req, res) => {
    const keyboardData = {
        ...req.body,
        ip: getClientIP(req),
        timestamp: new Date().toISOString()
    };
    
    logData({
        type: 'keyboard',
        data: keyboardData
    });
    
    res.json({ status: 'success' });
});

// Log page unload
app.post('/log-unload', (req, res) => {
    const unloadData = {
        ...req.body,
        ip: getClientIP(req),
        timestamp: new Date().toISOString()
    };
    
    logData({
        type: 'unload',
        data: unloadData
    });
    
    res.json({ status: 'success' });
});

// API endpoint to get stats
app.get('/admin/api', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
        
        // Create a comprehensive summary
        const summary = {
            totalVisitors: data.filter(item => item.type === 'visitor').length,
            totalActions: data.filter(item => item.type === 'action').length,
            totalInteractions: data.filter(item => item.type === 'interaction').length,
            totalScrolls: data.filter(item => item.type === 'scroll').length,
            totalMouseMovements: data.filter(item => item.type === 'mouse').length,
            totalKeyboardEvents: data.filter(item => item.type === 'keyboard').length,
            
            visitors: data.filter(item => item.type === 'visitor').map(item => ({
                timestamp: item.data.timestamp,
                ip: item.data.ip,
                location: item.data.location,
                userAgent: item.data.userAgent,
                deviceType: item.data.deviceType,
                osName: item.data.osName,
                browserName: item.data.browserName,
                browserVersion: item.data.browserVersion,
                screenWidth: item.data.screenWidth,
                screenHeight: item.data.screenHeight,
                isMobile: item.data.isMobile,
                isTablet: item.data.isTablet,
                isDesktop: item.data.isDesktop,
                language: item.data.language,
                timezone: item.data.timezone,
                referrer: item.data.referrer,
                hardwareConcurrency: item.data.hardwareConcurrency,
                maxTouchPoints: item.data.maxTouchPoints,
                webgl: item.data.webgl,
                canvasFingerprint: item.data.canvasFingerprint,
                plugins: item.data.plugins
            })),
            
            actions: data.filter(item => item.type === 'action').map(item => ({
                action: item.data.action,
                timestamp: item.data.timestamp,
                ip: item.data.ip
            }))
        };
        
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Download captured data
app.get('/download', (req, res) => {
    res.download(LOG_FILE, 'scammer_data.json');
});

// Raw data view
app.get('/raw', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 PASSIVE SCAMMER HONEYPOT SERVER RUNNING ON PORT ${PORT}`);
    console.log(`🎯 Send scammers to: http://localhost:${PORT}`);
    console.log(`🔒 Admin panel: http://localhost:${PORT}/admin`);
    console.log(`📊 API data: http://localhost:${PORT}/admin/api`);
    console.log(`📥 Download data: http://localhost:${PORT}/download`);
    console.log(`📱 NO USER ACTION REQUIRED - JUST CLICK THE LINK!`);
});
