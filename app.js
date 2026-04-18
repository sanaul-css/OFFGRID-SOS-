document.addEventListener('DOMContentLoaded', () => {
    // Screens
    const loginScreen = document.getElementById('login-screen');
    const signupScreen = document.getElementById('signup-screen');
    const homeScreen = document.getElementById('home-screen');
    const contactsScreen = document.getElementById('contacts-screen');
    const settingsScreen = document.getElementById('settings-screen');
    const mainBottomNav = document.getElementById('main-bottom-nav');

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
            if (screen.classList.contains('main-screen')) {
                mainBottomNav.style.display = 'flex';
            } else {
                mainBottomNav.style.display = 'none';
            }
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

    function startSOSTimer(title = "Emergency Detected!", desc = "Sending alert in") {
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

    function triggerSOSSuccess() {
        stopAlarm();
        sosTimerView.classList.remove('active');
        sosSuccessView.classList.add('active');
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
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const targetId = item.getAttribute('data-target');
            if (targetId) {
                showScreen(document.getElementById(targetId));
            }
        });
    });
});
