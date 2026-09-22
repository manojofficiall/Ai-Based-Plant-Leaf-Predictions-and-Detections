// detection.js
console.log('detection.js loaded successfully.');

document.addEventListener("DOMContentLoaded", () => {
    const uploadArea = document.getElementById("uploadArea");
    const plantImage = document.getElementById("plantImage");
    const browseButton = document.getElementById("browseButton");
    const previewContainer = document.getElementById("previewContainer");
    const imagePreview = document.getElementById("imagePreview");
    const removeImage = document.getElementById("removeImage");
    const analyzeButton = document.getElementById("analyzeButton");
    const uploadMessage = document.getElementById("uploadMessage");

    document.querySelectorAll(".plant-list .plant").forEach((plantCard) => {
        plantCard.addEventListener("mouseenter", () => {
            const plantName = plantCard.dataset.plant;
            const message = plantName === "Tomato" || plantName === "Potato"
                ? `${plantName} selected. Please upload a ${plantName.toLowerCase()} leaf.`
                : "This plant is not currently unavailable. Please choose Tomato or Potato.";

            if (window.AgriVisionVoice) {
                window.AgriVisionVoice.speak(message);
            }
        });
    });

    let selectedFile = null;

    // Trigger file input click when browse button or upload area is clicked
    if (browseButton) {
        browseButton.addEventListener("click", (e) => {
            e.stopPropagation();
            plantImage.click();
        });
    }

    if (uploadArea) {
        uploadArea.addEventListener("click", () => {
            plantImage.click();
        });

        // Drag & Drop handlers
        ["dragenter", "dragover"].forEach((eventName) => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.add("dragover");
            }, false);
        });

        ["dragleave", "drop"].forEach((eventName) => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove("dragover");
            }, false);
        });

        uploadArea.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });
    }

    if (plantImage) {
        plantImage.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });
    }

    if (removeImage) {
        removeImage.addEventListener("click", (e) => {
            e.stopPropagation();
            resetUpload();
        });
    }

    function handleFile(file) {
        // Validate file type
        const validTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (!validTypes.includes(file.type)) {
            showError("Invalid file type. Please upload a JPG, JPEG, or PNG image.");
            return;
        }

        // Validate file size (10 MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            showError("File is too large. Maximum size is 10 MB.");
            return;
        }

        selectedFile = file;
        showMessage(""); // Clear errors

        // Load preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            // Show preview container and hide upload area
            if (previewContainer) {
                previewContainer.classList.add("show");
            }
            if (uploadArea) {
                uploadArea.style.display = "none";
            }
            // Enable analyze button
            if (analyzeButton) {
                analyzeButton.disabled = false;
            }
        };
        reader.readAsDataURL(file);
    }

    function resetUpload() {
        selectedFile = null;
        if (plantImage) {
            plantImage.value = "";
        }
        if (imagePreview) {
            imagePreview.src = "";
        }
        if (previewContainer) {
            previewContainer.classList.remove("show");
        }
        if (uploadArea) {
            uploadArea.style.display = "flex";
        }
        if (analyzeButton) {
            analyzeButton.disabled = true;
        }
        showMessage("");
        
        // Restore info card back to instructions
        restoreInstructionsCard();
    }

    function showError(msg) {
        if (uploadMessage) {
            uploadMessage.textContent = msg;
            uploadMessage.style.color = "#ff8c7a";
        }
    }

    function showMessage(msg, color = "#7cff9b") {
        if (uploadMessage) {
            uploadMessage.textContent = msg;
            uploadMessage.style.color = color;
        }
    }

    // Analysis trigger
    if (analyzeButton) {
        analyzeButton.addEventListener("click", () => {
            if (!selectedFile) return;

            // Start loading state
            analyzeButton.disabled = true;
            analyzeButton.textContent = "Processing image...";

            const progressContainer = document.getElementById("progressContainer");
            const progressBarFill = document.getElementById("progressBarFill");
            const progressPercent = document.getElementById("progressPercent");
            const progressStatus = document.getElementById("progressStatus");

            if (progressContainer) progressContainer.style.display = "block";

            let progress = 0;
            const progressInterval = setInterval(() => {
                if (progress < 90) {
                    progress += Math.floor(Math.random() * 12) + 4;
                    if (progress > 90) progress = 90;
                    if (progressBarFill) progressBarFill.style.width = `${progress}%`;
                    if (progressPercent) progressPercent.textContent = `${progress}%`;
                }
            }, 100);

            // Create form data to send to backend Django view
            const formData = new FormData();
            formData.append("image", selectedFile);

            fetch("fetch("https://ai-based-plant-leaf-predictions-and-detections-production.up.railway.app/api/detect/", {
    method: "POST",
    body: formData
})", {
                method: "POST",    
                body: formData
            })
            .then(res => {
                if (!res.ok) throw new Error("Server error or endpoint missing");
                return res.json();
            })
            .then(data => {
                clearInterval(progressInterval);
                finishAnalysis(data);
            })
            .catch(err => {
                clearInterval(progressInterval);
                if (progressContainer) progressContainer.style.display = "none";
                if (progressBarFill) progressBarFill.style.width = "0%";
                if (progressPercent) progressPercent.textContent = "0%";
                if (progressStatus) progressStatus.textContent = "Analysis failed";
                if (analyzeButton) {
                    analyzeButton.disabled = false;
                    analyzeButton.textContent = "🧠 Analyze with DNN";
                }
                console.error("Plant image prediction failed:", err);
                showError("Could not analyze this image. Please ensure the backend is running and try again.");
            });
        });
    }

    function finishAnalysis(result) {
        result.confidence = Number(result.confidence || 0);
        const progressBarFill = document.getElementById("progressBarFill");
        const progressPercent = document.getElementById("progressPercent");
        const progressStatus = document.getElementById("progressStatus");
        const analyzeButton = document.getElementById("analyzeButton");

        if (progressBarFill) progressBarFill.style.width = "100%";
        if (progressPercent) progressPercent.textContent = "100%";
        if (progressStatus) progressStatus.textContent = "Analysis Complete!";

        setTimeout(() => {
            // Save current result
            localStorage.setItem("predictionResult", JSON.stringify(result));

            // Save to detection history array (user-specific and global)
            try {
                const currentUser = localStorage.getItem("userEmail") || "default_user";
                const userStorageKey = "plantDetections_" + currentUser;
                
                let userHistory = JSON.parse(localStorage.getItem(userStorageKey) || "[]");
                if (!Array.isArray(userHistory)) userHistory = [];
                
                const newRecord = {
                    id: Date.now(),
                    user: currentUser,
                    plant: result.plant || "Tomato",
                    disease: (result.disease || "Healthy").replace(/_/g, " "),
                    confidence: parseFloat(result.confidence || 0).toFixed(1),
                    isHealthy: (result.disease || "").toLowerCase().includes("healthy"),
                    date: new Date().toLocaleDateString([], { month: "short", day: "numeric" }),
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                };

                // Add to user history
                userHistory.unshift(newRecord);
                if (userHistory.length > 50) userHistory = userHistory.slice(0, 50);
                localStorage.setItem(userStorageKey, JSON.stringify(userHistory));

                // Also maintain global list for compatibility
                let globalHistory = JSON.parse(localStorage.getItem("plantDetections") || "[]");
                if (!Array.isArray(globalHistory)) globalHistory = [];
                globalHistory.unshift(newRecord);
                if (globalHistory.length > 50) globalHistory = globalHistory.slice(0, 50);
                localStorage.setItem("plantDetections", JSON.stringify(globalHistory));
            } catch (e) {
                console.error("Error updating detection history:", e);
            }

            // Enable button again and reset text
            if (analyzeButton) {
                analyzeButton.disabled = false;
                analyzeButton.textContent = "🧠 Analyze with DNN";
            }
            const progressContainer = document.getElementById("progressContainer");
            if (progressContainer) progressContainer.style.display = "none";

            // Render result in the info card
            renderResultCard(result);
        }, 500);
    }

    // Cache the original HTML of the instructions panel so we can restore it on reset
    const originalInfoCardHTML = document.querySelector(".info-card") ? document.querySelector(".info-card").innerHTML : null;

    function restoreInstructionsCard() {
        const infoCard = document.querySelector(".info-card");
        if (infoCard && originalInfoCardHTML) {
            // Cancel voice speech if speaking
            if (window.AgriVisionVoice) {
                window.AgriVisionVoice.stop();
            }
            infoCard.innerHTML = originalInfoCardHTML;
        }
    }

    function renderResultCard(result) {
        const infoCard = document.querySelector(".info-card");
        if (!infoCard) return;

        const diseaseData = window.AgriVisionVoice ? window.AgriVisionVoice.getDiseaseData(result) : null;
        const displayData = diseaseData || (result.plant && result.disease ? {
            plant: result.plant_name || result.plant,
            disease: result.disease,
            symptoms: result.symptoms || "Disease symptoms identified by the model.",
            solution: result.solution || "Inspect the plant and apply appropriate care.",
            prevention: result.prevention || "Maintain good air circulation and monitor the plant regularly."
        } : null);
        if (!displayData) {
            infoCard.innerHTML = `
                <div class="ai-avatar-animated-container">
                    <div class="ai-avatar">🤖</div>
                </div>
                <h2 style="text-align: center; margin-top: 20px;">Analysis Error</h2>
                <p class="description" style="text-align: center;">Could not load disease information from the local database. Result: ${result.plant} - ${result.disease}</p>
            `;
            return;
        }

        const isHealthy = displayData.disease === "Healthy";
        const badgeClass = isHealthy ? "badge-healthy" : "badge-disease";
        const statusText = isHealthy ? "Healthy Leaf" : `${displayData.disease} detected`;

        infoCard.innerHTML = `
            <div class="ai-avatar-animated-container" id="aiAvatarContainer">
                <div class="ai-avatar-glow"></div>
                <div class="ai-avatar">🤖</div>
            </div>

            <div class="result-header">
                <p class="label">DNN DIAGNOSIS</p>
                <div class="result-title">${displayData.plant}</div>
                <div class="result-badge ${badgeClass}">${statusText}</div>
                <div class="confidence-indicator">Confidence: <span>${Number(result.confidence || 0).toFixed(1)}%</span></div>
            </div>

            <!-- Voice Assistant Integration -->
            <div class="voice-assistant-panel">
                <p class="voice-title">🎙️ AI VOICE ASSISTANT</p>
                <p id="voiceStatus" class="voice-status">🤖 AI Assistant ready</p>
                <div class="voice-controls">
                    <button id="voiceButton" class="voice-btn play-btn">🔊 Speak Result</button>
                    <button id="stopVoiceButton" class="voice-btn stop-btn">⏹️ Stop</button>
                </div>
            </div>

            <!-- Detailed diagnosis -->
            <div class="result-details">
                <div class="result-section-card">
                    <strong>Symptoms</strong>
                    <p>${displayData.symptoms}</p>
                </div>
                <div class="result-section-card">
                    <strong>Recommended Treatment</strong>
                    <p>${displayData.solution}</p>
                </div>
                <div class="result-section-card">
                    <strong>Prevention</strong>
                    <p>${displayData.prevention}</p>
                </div>
            </div>
        `;

        // Bind event listeners to new elements in DOM
        const voiceBtn = document.getElementById("voiceButton");
        const stopBtn = document.getElementById("stopVoiceButton");
        const aiAvatarContainer = document.getElementById("aiAvatarContainer");

        if (voiceBtn && window.AgriVisionVoice) {
            voiceBtn.addEventListener("click", () => {
                window.AgriVisionVoice.speakPrediction();
            });
        }

        if (stopBtn && window.AgriVisionVoice) {
            stopBtn.addEventListener("click", () => {
                window.AgriVisionVoice.stop();
            });
        }

        // Set up speaking feedback observer
        const statusEl = document.getElementById("voiceStatus");
        if (statusEl && aiAvatarContainer) {
            const observer = new MutationObserver(() => {
                if (statusEl.textContent.includes("speaking")) {
                    aiAvatarContainer.classList.add("speaking");
                } else {
                    aiAvatarContainer.classList.remove("speaking");
                }
            });
            observer.observe(statusEl, { childList: true, characterData: true, subtree: true });
        }

        // Auto-speak prediction result immediately!
        if (window.AgriVisionVoice) {
            setTimeout(() => {
                window.AgriVisionVoice.speakPrediction();
            }, 400);
        }
    }
});
