// dashboard.js
console.log('dashboard.js loaded successfully.');

const userName = document.getElementById("userName");
const totalScans = document.getElementById("totalScans");
const diseasesDetected = document.getElementById("diseasesDetected");
const confidence = document.getElementById("confidence");
const healthyPlants = document.getElementById("healthyPlants");
const logoutButton = document.getElementById("logoutButton");
const voiceButton = document.getElementById("voiceButton");
const voiceStatus = document.getElementById("voiceStatus");
const recentDetections = document.getElementById("recentDetections");

const storedEmail = localStorage.getItem("userEmail");
const storedName = localStorage.getItem("userName");
const isLoggedIn = localStorage.getItem("isLoggedIn");

if (!isLoggedIn || !storedEmail) {
    window.location.href = "login.html";
} else {
    userName.textContent = storedName || "User";
}

// Function to load and render dynamic dashboard stats from user detections
function updateDashboardMetrics() {
    let detections = [];
    try {
        const userKey = "plantDetections_" + (storedEmail || "default_user");
        detections = JSON.parse(localStorage.getItem(userKey) || "[]");
        if (!Array.isArray(detections)) detections = [];
    } catch (e) {
        console.error("Error reading user plantDetections from localStorage:", e);
        detections = [];
    }

    const totalCount = detections.length;

    if (totalCount === 0) {
        // Default clean state before any detections are made
        if (totalScans) totalScans.textContent = "0";
        if (diseasesDetected) diseasesDetected.textContent = "0";
        if (confidence) confidence.textContent = "0%";
        if (healthyPlants) healthyPlants.textContent = "0";

        if (recentDetections) {
            recentDetections.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 28px; color: #748279; font-size: 14px;">
                        🌱 No scans yet. Click <strong><a href="detect.html" style="color: #7cff9b; text-decoration: none;">"New Detection"</a></strong> to analyze your first plant!
                    </td>
                </tr>
            `;
        }
        return;
    }

    // Calculate metrics from real detections
    let diseaseCount = 0;
    let healthyCount = 0;
    let totalConfidence = 0;

    detections.forEach(item => {
        const isHealthy = item.isHealthy || (item.disease || "").toLowerCase().includes("healthy");
        if (isHealthy) {
            healthyCount++;
        } else {
            diseaseCount++;
        }
        totalConfidence += parseFloat(item.confidence || 0);
    });

    const avgConfidence = (totalConfidence / totalCount).toFixed(1);

    // Update stat cards
    if (totalScans) totalScans.textContent = totalCount;
    if (diseasesDetected) diseasesDetected.textContent = diseaseCount;
    if (confidence) confidence.textContent = avgConfidence + "%";
    if (healthyPlants) healthyPlants.textContent = healthyCount;

    // Render Recent Detections table (latest 5)
    if (recentDetections) {
        recentDetections.innerHTML = "";
        const latestDetections = detections.slice(0, 5);

        latestDetections.forEach(item => {
            const tr = document.createElement("tr");

            // Plant icon
            let plantIcon = "🌿";
            const plantLower = (item.plant || "").toLowerCase();
            if (plantLower.includes("tomato")) plantIcon = "🍅";
            else if (plantLower.includes("potato")) plantIcon = "🥔";
            else if (plantLower.includes("apple")) plantIcon = "🍎";
            else if (plantLower.includes("corn") || plantLower.includes("maize")) plantIcon = "🌽";

            const isHealthy = item.isHealthy || (item.disease || "").toLowerCase().includes("healthy");
            const statusClass = isHealthy ? "status healthy" : "status disease";
            const statusText = isHealthy ? "Healthy" : "Detected";

            tr.innerHTML = `
                <td>${plantIcon} ${item.plant || "Plant"}</td>
                <td>${item.disease || "Unknown"}</td>
                <td>${item.confidence || "--"}%</td>
                <td><span class="${statusClass}">${statusText}</span></td>
            `;

            recentDetections.appendChild(tr);
        });
    }
}

// Initial render
updateDashboardMetrics();

// Logout handler
if (logoutButton) {
    logoutButton.addEventListener("click", function() {
        localStorage.removeItem("userEmail");
        localStorage.removeItem("isLoggedIn");
        window.location.href = "login.html";
    });
}

// Voice assistant button handler
if (voiceButton) {
    voiceButton.addEventListener("click", function() {
        const total = totalScans ? totalScans.textContent : "0";
        const diseases = diseasesDetected ? diseasesDetected.textContent : "0";
        const healthy = healthyPlants ? healthyPlants.textContent : "0";

        let message = `Hello ${storedEmail ? storedEmail.split("@")[0] : "there"}. `;
        if (parseInt(total) === 0) {
            message += "You have not performed any plant scans yet. Click New Detection to scan your first plant leaf.";
        } else {
            message += `You have completed ${total} total scans, with ${diseases} disease cases detected and ${healthy} healthy plants.`;
        }

        if ("speechSynthesis" in window) {
            const speech = new SpeechSynthesisUtterance(message);
            speech.rate = 0.9;
            speech.pitch = 1;
            speech.volume = 1;

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(speech);

            if (voiceStatus) voiceStatus.textContent = "🔊 AI Assistant is speaking...";

            speech.onend = function() {
                if (voiceStatus) voiceStatus.textContent = "Voice assistant ready";
            };
        } else {
            if (voiceStatus) voiceStatus.textContent = "Voice is not supported by this browser.";
        }
    });
}
