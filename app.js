document.addEventListener('DOMContentLoaded', () => {
    // Screens
    const loginScreen = document.getElementById('login-screen');
    const signupScreen = document.getElementById('signup-screen');
    const homeScreen = document.getElementById('home-screen');
    const contactsScreen = document.getElementById('contacts-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const mainBottomNav = document.getElementById('main-bottom-nav');
    
    // Helper Portal
    const helperLoginScreen = document.getElementById('helper-login-screen');
    const helperPortal = document.getElementById('helper-portal');
    const helperLoginForm = document.getElementById('helper-login-form');
    const helperNameInput = document.getElementById('helper-name');
    const helperRoleSelect = document.getElementById('helper-role');
    const helperRoleDisplay = document.getElementById('helper-role-display');
    const helperAlertsList = document.getElementById('helper-alerts-list');
    const btnHelperLogout = document.getElementById('btn-helper-logout');
    
    // Login Selection
    const loginOptions = document.getElementById('login-options');
    const btnShowUserLogin = document.getElementById('btn-show-user-login');
    const btnShowHelperLogin = document.getElementById('btn-show-helper-login');
    const linkBackOptions = document.getElementById('link-back-options');
    const linkBackHelperOptions = document.getElementById('link-back-helper-options');
    const nearestServicesList = document.getElementById('nearest-services-list');
    const mapStatus = document.getElementById('map-status');

    // Forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Links
    const linkSignup = document.getElementById('link-signup');
    const linkLogin = document.getElementById('link-login');

    // SOS Button
    const sosBtn = document.getElementById('sos-btn');

    // Helper to switch screens
    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');

        if (mainBottomNav) {
            if (screen.classList.contains('main-screen') && screen.id !== 'helper-portal') {
                mainBottomNav.style.display = 'flex';
            } else {
                mainBottomNav.style.display = 'none';
            }
        }

        if (screen.id === 'home-screen' && map) {
            setTimeout(() => { map.invalidateSize(); }, 100);
        }
    }

    // Event Listeners for Navigation
    linkSignup.addEventListener('click', (e) => {
        e.preventDefault();
        showScreen(signupScreen);
    });

    linkLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showScreen(loginScreen);
    });

    // Form Submissions (Mocking Auth)
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real app, validate credentials here
        showScreen(homeScreen);
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real app, create user here
        showScreen(homeScreen);
    });

    // Login Selection Navigation
    if (btnShowUserLogin) btnShowUserLogin.addEventListener('click', () => {
        loginOptions.style.display = 'none';
        loginForm.style.display = 'block';
    });
    
    if (btnShowHelperLogin) btnShowHelperLogin.addEventListener('click', () => {
        showScreen(helperLoginScreen);
    });

    if (linkBackOptions) linkBackOptions.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        loginOptions.style.display = 'flex';
    });

    if (linkBackHelperOptions) linkBackHelperOptions.addEventListener('click', (e) => {
        e.preventDefault();
        showScreen(loginScreen);
        loginForm.style.display = 'none';
        loginOptions.style.display = 'flex';
    });

    let helperMovementInterval;

    if (helperLoginForm) helperLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const helperName = helperNameInput.value.trim();
        const helperRole = helperRoleSelect.options[helperRoleSelect.selectedIndex].text;
        
        // Generate random nearby location based on user location or default
        let initialLat = 40.7128;
        let initialLng = -74.0060;
        
        if (userLocation) {
            initialLat = userLocation.lat + (Math.random() * 0.02 - 0.01);
            initialLng = userLocation.lng + (Math.random() * 0.02 - 0.01);
        } else {
            initialLat += (Math.random() * 0.02 - 0.01);
            initialLng += (Math.random() * 0.02 - 0.01);
        }

        // Store helper data in localStorage
        const helperData = {
            name: helperName,
            role: helperRole,
            latitude: initialLat,
            longitude: initialLng
        };
        localStorage.setItem('safenet_helper', JSON.stringify(helperData));
        
        // Show Helper Dashboard
        helperRoleDisplay.textContent = helperName + ' - ' + helperRole;
        showScreen(helperPortal);
        renderHelperAlerts();
        
        // Start simulated movement
        startHelperMovement();
    });

    function startHelperMovement() {
        if (helperMovementInterval) clearInterval(helperMovementInterval);
        
        helperMovementInterval = setInterval(() => {
            let dataStr = localStorage.getItem('safenet_helper');
            if (dataStr) {
                let data = JSON.parse(dataStr);
                // Simulate slight movement (approx a few meters)
                data.latitude += (Math.random() * 0.0004 - 0.0002);
                data.longitude += (Math.random() * 0.0004 - 0.0002);
                localStorage.setItem('safenet_helper', JSON.stringify(data));
                console.log("Simulated Helper Location:", data.latitude.toFixed(5), data.longitude.toFixed(5));
            }
        }, 3000); // Update every 3 seconds
    }

    if (btnHelperLogout) btnHelperLogout.addEventListener('click', (e) => { 
        e.preventDefault(); 
        
        // Stop simulated movement and clear data
        if (helperMovementInterval) clearInterval(helperMovementInterval);
        localStorage.removeItem('safenet_helper');
        
        showScreen(loginScreen); 
        if (loginForm && loginOptions) {
            loginForm.style.display = 'none';
            loginOptions.style.display = 'flex';
        }
    });

    // SOS Modal Elements
    const sosModal = document.getElementById('sos-modal');
    const sosTimerView = document.getElementById('sos-timer-view');
    const sosSuccessView = document.getElementById('sos-success-view');
    const sosTimerDisplay = document.getElementById('sos-timer');
    const cancelSosBtn = document.getElementById('cancel-sos-btn');
    const closeSuccessBtn = document.getElementById('close-success-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const simulateAccidentBtn = document.getElementById('simulate-accident-btn');
    const enableAiBtn = document.getElementById('enable-ai-btn');
    const aiStatusIndicator = document.getElementById('ai-status-indicator');

    let countdownInterval;
    let defaultCountdownTime = 30;
    let timeLeft = defaultCountdownTime;
    let aiEnabled = false;

    // Alarm Sound System
    let audioCtx;
    let oscillator;
    let gainNode;
    let alarmInterval;

    function startAlarm() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        
        let isHigh = false;
        alarmInterval = setInterval(() => {
            isHigh = !isHigh;
            if (oscillator) oscillator.frequency.setValueAtTime(isHigh ? 600 : 400, audioCtx.currentTime);
        }, 500);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        oscillator.start();
    }

    function stopAlarm() {
        if (oscillator) {
            oscillator.stop();
            oscillator.disconnect();
            oscillator = null;
        }
        if (alarmInterval) {
            clearInterval(alarmInterval);
            alarmInterval = null;
        }
    }

    function startSOSTimer(title = "Emergency Detected!", desc = "Locating nearest responders...") {
        if (modalTitle) modalTitle.textContent = title;
        if (modalDesc) modalDesc.textContent = desc;

        timeLeft = defaultCountdownTime;
        sosTimerDisplay.textContent = timeLeft;
        sosTimerView.classList.add('active');
        sosSuccessView.classList.remove('active');
        sosModal.classList.add('active');

        startAlarm();

        countdownInterval = setInterval(() => {
            timeLeft--;
            sosTimerDisplay.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                triggerSOSSuccess();
            }
        }, 1000);
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; 
    }

    function triggerSOSSuccess() {
        stopAlarm();
        sosTimerView.classList.remove('active');
        sosSuccessView.classList.add('active');

        const successTitle = document.querySelector('#sos-success-view h2');
        const successIcon = document.querySelector('#sos-success-view .success-icon i');
        const closeBtn = document.getElementById('close-success-btn');
        const notifiedList = document.getElementById('sos-notified-list');

        if (successTitle) successTitle.textContent = "Notifying nearest responders...";
        if (successIcon) {
            successIcon.className = "fa-solid fa-spinner fa-spin";
            successIcon.style.color = "var(--text-main)";
        }
        if (closeBtn) closeBtn.style.display = 'none';
        
        if (notifiedList) {
            notifiedList.innerHTML = '';
            
            let allHelpers = [];
            
            // Add mock responders
            nearestResponders.forEach(r => {
                let role = r.type === 'hospital' ? 'Ambulance' : (r.type === 'police' ? 'Police' : 'Firefighter');
                allHelpers.push({
                    name: r.name,
                    role: role,
                    lat: r.lat,
                    lng: r.lng,
                    icon: r.icon
                });
            });

            // Add local helper if exists
            let helperDataStr = localStorage.getItem('safenet_helper');
            if (helperDataStr) {
                let h = JSON.parse(helperDataStr);
                let icon = 'fa-user-nurse';
                if (h.role === 'Ambulance') icon = 'fa-truck-medical';
                if (h.role === 'Police') icon = 'fa-building-shield';
                if (h.role === 'Firefighter') icon = 'fa-fire-extinguisher';
                
                allHelpers.push({
                    name: h.name,
                    role: h.role,
                    lat: h.latitude,
                    lng: h.longitude,
                    icon: icon
                });
            }

            let displayHelpers = [];

            if (userLocation) {
                // Calculate distance for all
                allHelpers.forEach(h => {
                    h.distKm = calculateDistance(userLocation.lat, userLocation.lng, h.lat, h.lng);
                });

                // Find nearest Ambulance, Police, Firefighter
                const rolesToFind = ['Ambulance', 'Police', 'Firefighter'];
                
                rolesToFind.forEach(role => {
                    let filtered = allHelpers.filter(h => h.role === role);
                    if (filtered.length > 0) {
                        // Sort by distance ascending
                        filtered.sort((a, b) => a.distKm - b.distKm);
                        displayHelpers.push(filtered[0]);
                    }
                });
            } else {
                // If no user location, just show whatever helpers we have
                displayHelpers = allHelpers;
            }

            displayHelpers.forEach(h => {
                const li = document.createElement('li');
                let distText = h.distKm !== undefined ? h.distKm.toFixed(2) + ' km' : 'Unknown distance';
                li.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; width: 100%;">
                        <div>
                            <i class="fa-solid ${h.icon}"></i> <strong>${h.name}</strong> (${h.role})<br>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">${distText} away</span>
                        </div>
                        <div class="responder-status" style="font-size: 0.8rem; font-weight: bold; color: var(--text-main); text-align: right;">
                            <i class="fa-solid fa-spinner fa-spin"></i> Notifying
                        </div>
                    </div>
                `;
                notifiedList.appendChild(li);
            });
        }

        // Simulate delays for realistic SOS flow
        setTimeout(() => {
            if (successTitle) successTitle.textContent = "SOS Alert Sent";
            if (successIcon) {
                successIcon.className = "fa-solid fa-circle-check";
                successIcon.style.color = "var(--hospital-green)";
            }
            if (notifiedList) {
                const statuses = notifiedList.querySelectorAll('.responder-status');
                statuses.forEach(s => {
                    s.innerHTML = `<i class="fa-solid fa-check"></i> Alert Sent`;
                    s.style.color = "var(--hospital-green)";
                });
            }

            setTimeout(() => {
                if (successTitle) successTitle.textContent = "Responders On The Way";
                if (notifiedList) {
                    const statuses = notifiedList.querySelectorAll('.responder-status');
                    statuses.forEach(s => {
                        s.innerHTML = `<i class="fa-solid fa-truck-fast"></i> On the way`;
                        s.style.color = "var(--accent-blue)";
                    });
                }
                if (closeBtn) closeBtn.style.display = 'block';
                
                createResponderAlert();
            }, 3000); // Wait another 3s before they are "on the way"
            
        }, 2000); // Wait 2s to send alert
    }

    function resetSOS() {
        stopAlarm();
        clearInterval(countdownInterval);
        sosModal.classList.remove('active');
    }

    // SOS Button Click
    sosBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Add quick animation
        sosBtn.style.transform = 'scale(0.95)';
        setTimeout(() => { sosBtn.style.transform = ''; }, 150);
        
        startSOSTimer("Emergency Detected!", "Sending alert in");
    });

    // Enable AI Button
    if (enableAiBtn) {
        enableAiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Request permission for motion sensors on iOS 13+
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
                DeviceMotionEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            activateAI();
                        } else {
                            alert('Permission to access device motion is required for AI Detection.');
                        }
                    })
                    .catch(console.error);
            } else {
                // Non iOS 13+ devices
                activateAI();
            }
        });
    }

    function activateAI() {
        aiEnabled = true;
        if (aiStatusIndicator) {
            aiStatusIndicator.style.display = 'flex';
        }
        alert('AI Detection Enabled');
    }

    // Simulate Accident Button
    if (simulateAccidentBtn) {
        simulateAccidentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            startSOSTimer("Possible accident detected!", "Sending SOS in");
        });
    }

    // Shake Detection for Auto-Emergency
    let lastX, lastY, lastZ;
    let shakeThreshold = 20; // Increased threshold for strong shocks
    let lastShakeTime = 0;

    window.addEventListener('devicemotion', (event) => {
        if (!aiEnabled || !event.accelerationIncludingGravity) return;
        
        let { x, y, z } = event.accelerationIncludingGravity;
        if (lastX === undefined) {
            lastX = x; lastY = y; lastZ = z;
            return;
        }

        let deltaX = Math.abs(lastX - x);
        let deltaY = Math.abs(lastY - y);
        let deltaZ = Math.abs(lastZ - z);

        if ((deltaX > shakeThreshold && deltaY > shakeThreshold) || 
            (deltaX > shakeThreshold && deltaZ > shakeThreshold) || 
            (deltaY > shakeThreshold && deltaZ > shakeThreshold)) {
            
            let currentTime = new Date().getTime();
            if (currentTime - lastShakeTime > 2000) { // debounce 2s
                lastShakeTime = currentTime;
                if (!sosModal.classList.contains('active')) {
                    startSOSTimer("Possible accident detected!", "Sending SOS in");
                }
            }
        }
        
        lastX = x; lastY = y; lastZ = z;
    });

    // Cancel Button
    cancelSosBtn.addEventListener('click', () => {
        resetSOS();
    });

    // Close Success Modal Button
    closeSuccessBtn.addEventListener('click', () => {
        resetSOS();
    });

    // --- Contacts Logic ---
    const addContactForm = document.getElementById('add-contact-form');
    const contactNameInput = document.getElementById('contact-name');
    const contactPhoneInput = document.getElementById('contact-phone');
    const savedContactsList = document.getElementById('saved-contacts-list');
    
    // Load contacts from localStorage or use default
    let savedContacts = JSON.parse(localStorage.getItem('safenet_contacts')) || [
        { id: 1, name: 'Mom', phone: '555-0100' }
    ];

    function renderContacts() {
        if (!savedContactsList) return;
        savedContactsList.innerHTML = '';
        
        if (savedContacts.length === 0) {
            savedContactsList.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding: 1rem 0;">No contacts saved yet.</p>';
            return;
        }

        savedContacts.forEach(contact => {
            const initial = contact.name.charAt(0).toUpperCase();
            const contactEl = document.createElement('div');
            contactEl.className = 'contact-item';
            contactEl.innerHTML = `
                <div class="contact-avatar">${initial}</div>
                <div class="contact-info">
                    <h4>${contact.name}</h4>
                    <p>${contact.phone}</p>
                </div>
                <button class="call-btn" title="Call"><i class="fa-solid fa-phone"></i></button>
                <button class="delete-btn" data-id="${contact.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
            `;
            savedContactsList.appendChild(contactEl);
        });

        // Add delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                savedContacts = savedContacts.filter(c => c.id !== id);
                localStorage.setItem('safenet_contacts', JSON.stringify(savedContacts));
                renderContacts();
            });
        });
    }

    if (addContactForm) {
        addContactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newContact = {
                id: Date.now(),
                name: contactNameInput.value.trim(),
                phone: contactPhoneInput.value.trim()
            };
            if (newContact.name && newContact.phone) {
                savedContacts.push(newContact);
                localStorage.setItem('safenet_contacts', JSON.stringify(savedContacts));
                contactNameInput.value = '';
                contactPhoneInput.value = '';
                renderContacts();
            }
        });
    }

    // Initial render
    renderContacts();

    // --- Settings Logic ---
    const settingAiToggle = document.getElementById('setting-ai-toggle');
    const settingCountdownTime = document.getElementById('setting-countdown-time');

    if (settingAiToggle) {
        settingAiToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                activateAI();
            } else {
                aiEnabled = false;
                if (aiStatusIndicator) {
                    aiStatusIndicator.style.display = 'none';
                }
            }
        });
    }

    if (settingCountdownTime) {
        settingCountdownTime.addEventListener('change', (e) => {
            let val = parseInt(e.target.value);
            if (val >= 5 && val <= 120) {
                defaultCountdownTime = val;
            } else {
                e.target.value = defaultCountdownTime;
            }
        });
    }

    // Bottom Navigation Interactions
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Only update active state if it's the main bottom nav, skip helper nav
            if (!item.closest('#helper-portal')) {
                navItems.forEach(nav => {
                    if(!nav.closest('#helper-portal')) nav.classList.remove('active');
                });
                item.classList.add('active');
            }
            
            const targetId = item.getAttribute('data-target');
            if (targetId) {
                showScreen(document.getElementById(targetId));
            }
        });
    });

    // --- Location & Maps ---
    let map;
    let userMarker;
    let userLocation = null;
    let nearestResponders = [];
    const mapContainer = document.getElementById('map');

    function initMap() {
        if (!mapContainer || typeof L === 'undefined') return;

        map = L.map('map').setView([40.7128, -74.0060], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                userLocation = { lat, lng };

                map.setView([lat, lng], 14);
                
                userMarker = L.circleMarker([lat, lng], {
                    color: '#0ea5e9',
                    fillColor: '#0ea5e9',
                    fillOpacity: 0.5,
                    radius: 8
                }).addTo(map).bindPopup("You are here");

                if (mapStatus) mapStatus.style.display = 'none';

                generateMockResponders(lat, lng);
            }, err => {
                console.error("Error getting location:", err);
                if (mapStatus) mapStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Location disabled';
                generateMockResponders(40.7128, -74.0060);
            });
        } else {
            generateMockResponders(40.7128, -74.0060);
        }
    }

    function generateMockResponders(lat, lng) {
        nearestResponders = [
            { id: 'h1', type: 'hospital', name: 'City Central Hospital', distance: '0.8 miles', lat: lat + 0.01, lng: lng + 0.01, icon: 'fa-truck-medical', colorClass: 'hospital' },
            { id: 'p1', type: 'police', name: 'District 4 Police', distance: '1.2 miles', lat: lat - 0.015, lng: lng + 0.005, icon: 'fa-building-shield', colorClass: 'police' },
            { id: 'f1', type: 'fire', name: 'Station 12 Fire Dept', distance: '2.1 miles', lat: lat + 0.005, lng: lng - 0.02, icon: 'fa-fire-extinguisher', colorClass: 'fire' }
        ];

        if (map) {
            nearestResponders.forEach(r => {
                let color = r.type === 'hospital' ? '#10b981' : (r.type === 'police' ? '#3b82f6' : '#f97316');
                L.marker([r.lat, r.lng]).addTo(map).bindPopup(r.name);
            });
        }

        renderNearestServices();
    }

    function renderNearestServices() {
        if (!nearestServicesList) return;
        nearestServicesList.innerHTML = '';
        
        nearestResponders.forEach(r => {
            const item = document.createElement('div');
            item.className = 'service-item';
            item.innerHTML = `
                <div class="service-icon ${r.colorClass}"><i class="fa-solid ${r.icon}"></i></div>
                <div class="service-info">
                    <h4>${r.name}</h4>
                    <p>${r.distance} away</p>
                </div>
            `;
            nearestServicesList.appendChild(item);
        });
    }

    // --- Helper Portal Logic ---
    let activeAlerts = [];

    function createResponderAlert() {
        activeAlerts.push({
            id: Date.now(),
            user: 'User Demo',
            location: 'GPS ' + (userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Unknown'),
            severity: 'CRITICAL',
            time: new Date().toLocaleTimeString()
        });
        
        // Update view if currently on Helper portal
        renderHelperAlerts();
    }

    function renderHelperAlerts() {
        if (!helperAlertsList) return;
        if (activeAlerts.length === 0) {
            helperAlertsList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No active alerts at this time.</p>';
            return;
        }

        helperAlertsList.innerHTML = '';
        activeAlerts.forEach(alert => {
            const card = document.createElement('div');
            card.className = 'responder-alert-card';
            card.innerHTML = `
                <div class="alert-header">
                    <h4><i class="fa-solid fa-bell fa-shake" style="color:var(--sos-red);"></i> Incoming SOS</h4>
                    <span class="badge critical">${alert.severity}</span>
                </div>
                <div class="alert-details">
                    <p><strong><i class="fa-solid fa-user"></i></strong> ${alert.user}</p>
                    <p><strong><i class="fa-solid fa-location-dot"></i></strong> ${alert.location}</p>
                    <p><strong><i class="fa-regular fa-clock"></i></strong> ${alert.time}</p>
                </div>
                <div class="alert-actions">
                    <button class="btn-reject" data-id="${alert.id}">Reject</button>
                    <button class="btn-accept" data-id="${alert.id}">Accept Mission</button>
                </div>
            `;
            helperAlertsList.appendChild(card);
        });

        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                activeAlerts = activeAlerts.filter(a => a.id !== id);
                renderHelperAlerts();
            });
        });

        document.querySelectorAll('.btn-accept').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.textContent = 'En Route';
                e.target.style.background = '#3b82f6';
            });
        });
    }

    // Init Map
    setTimeout(initMap, 500);
});
