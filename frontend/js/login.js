// login.js
console.log('login.js loaded successfully.');

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const googleLogin = document.getElementById("googleLogin");

function redirectToDashboard() {
    window.location.replace("dashboard.html");
}

// ─── Already logged in? ───────────────────────────────────────────────────────
if (localStorage.getItem("isLoggedIn") === "true") {
    redirectToDashboard();
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function showLoginMessage(msg, color) {
    if (loginMessage) {
        loginMessage.textContent = msg;
        loginMessage.style.color = color || '#2e7d32';
    }
}

// ─── Google Identity Services (Popup / Token flow) ───────────────────────────
let tokenClient;

function initGoogleClient() {
    const clientId = (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_CLIENT_ID)
        ? CONFIG.GOOGLE_CLIENT_ID : '';

    if (!clientId || typeof google === 'undefined' || !google.accounts) return;

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        callback: (tokenResponse) => {
            if (tokenResponse.error) {
                showLoginMessage('❌ Google sign-in failed: ' + tokenResponse.error, '#d32f2f');
                return;
            }

            showLoginMessage('🔐 Authenticating with Google...', '#2e7d32');

            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': 'Bearer ' + tokenResponse.access_token }
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch user info');
                return res.json();
            })
            .then(data => {
                if (data.email) {
                    localStorage.setItem('userEmail', data.email);
                    localStorage.setItem('userName', data.name || data.email);
                    localStorage.setItem('isLoggedIn', 'true');
                    showLoginMessage(`👋 Welcome, ${data.name || data.email}! Redirecting...`, '#2e7d32');
                    setTimeout(() => {
                        redirectToDashboard();
                    }, 1000);
                } else {
                    showLoginMessage('❌ Google login failed: Email not found.', '#d32f2f');
                }
            })
            .catch(err => {
                console.error('Google userinfo error:', err);
                showLoginMessage('❌ Error authenticating with Google.', '#d32f2f');
            });
        }
    });
}

window.addEventListener('load', () => {
    const googleReady = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
            clearInterval(googleReady);
            initGoogleClient();
        }
    }, 100);

    setTimeout(() => clearInterval(googleReady), 10000);
});

// ─── Email / Password form ────────────────────────────────────────────────────
loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        showLoginMessage("Please enter email and password.", "#d32f2f");
        return;
    }

    showLoginMessage("🔐 Signing in...", "#2e7d32");

    setTimeout(function () {
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userName", email.split('@')[0]);
        localStorage.setItem("isLoggedIn", "true");
        redirectToDashboard();
    }, 1200);
});

// ─── Google Login button ──────────────────────────────────────────────────────
googleLogin.addEventListener("click", function () {
    const clientId = (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_CLIENT_ID)
        ? CONFIG.GOOGLE_CLIENT_ID : '';

    if (!clientId || clientId.includes("your-google-client-id")) {
        showLoginMessage("❌ Google Client ID is not configured in config.js", "#d32f2f");
        return;
    }

    if (!tokenClient) {
        initGoogleClient();
    }

    if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: 'select_account' });
    } else {
        showLoginMessage("❌ Google Sign-In is not ready. Please refresh and try again.", "#d32f2f");
    }
});
