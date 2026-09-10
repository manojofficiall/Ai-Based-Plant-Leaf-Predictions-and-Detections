// voice-assistant.js - AgriVision AI Voice Assistant

const diseaseDatabase = {
    "Tomato___Healthy": {
        plant: "Tomato",
        leaf: "Tomato Leaf",
        disease: "Healthy",
        symptoms: "The leaf appears vibrant green with no visible lesions, yellowing, or spots.",
        solution: "The tomato plant is in optimal health. Continue proper watering, sunlight, and soil nutrition.",
        prevention: "Maintain adequate air circulation, avoid wet foliage, and monitor leaves regularly."
    },
    "Tomato___Early_Blight": {
        plant: "Tomato",
        leaf: "Tomato Leaf",
        disease: "Early Blight",
        symptoms: "Concentric circular dark brown or black spots with yellow halos on older leaves.",
        solution: "Remove infected leaves, improve air circulation, and apply copper-based fungicide or neem oil.",
        prevention: "Maintain proper spacing between plants, avoid overhead watering, and practice crop rotation."
    },
    "Tomato___Late_Blight": {
        plant: "Tomato",
        leaf: "Tomato Leaf",
        disease: "Late Blight",
        symptoms: "Dark irregular water-soaked spots, pale halos, and rapid foliage decay.",
        solution: "Remove severely infected plant parts immediately and apply chlorothalonil or copper fungicide.",
        prevention: "Avoid wet foliage, ensure good ventilation, and monitor plants closely in humid weather."
    },
    "Tomato___Bacterial_Spot": {
        plant: "Tomato",
        leaf: "Tomato Leaf",
        disease: "Bacterial Spot",
        symptoms: "Small, water-soaked dark spots on leaves that turn brown and scabbed.",
        solution: "Apply copper-based bactericide, prune diseased foliage, and avoid handling wet plants.",
        prevention: "Use certified disease-free seeds and avoid overhead sprinkler irrigation."
    },
    "Tomato___Leaf_Mold": {
        plant: "Tomato",
        leaf: "Tomato Leaf",
        disease: "Leaf Mold",
        symptoms: "Pale green or yellow spots on upper leaf surface with velvety olive-green mold underneath.",
        solution: "Increase ventilation, reduce humidity, and spray appropriate fungicide if severe.",
        prevention: "Space plants generously for maximum airflow and keep greenhouse humidity low."
    },
    "Tomato___Septoria_Leaf_Spot": {
        plant: "Tomato",
        leaf: "Tomato Leaf",
        disease: "Septoria Leaf Spot",
        symptoms: "Numerous small circular spots with dark margins and gray centers on lower leaves.",
        solution: "Remove lower infected leaves and treat foliage with copper or chlorothalonil spray.",
        prevention: "Mulch around base to prevent soil splash and practice strict crop rotation."
    },
    "Potato___Healthy": {
        plant: "Potato",
        leaf: "Potato Leaf",
        disease: "Healthy",
        symptoms: "Uniform green foliage with firm stems and no signs of bacterial or fungal damage.",
        solution: "The potato plant appears healthy. Continue proper watering, sunlight, and soil nutrition.",
        prevention: "Keep the growing area clean and regularly inspect leaves for pests or spots."
    },
    "Potato___Early_Blight": {
        plant: "Potato",
        leaf: "Potato Leaf",
        disease: "Early Blight",
        symptoms: "Dark circular target-board spots with yellow halos on lower leaves.",
        solution: "Remove infected leaves, improve airflow, and spray protective bio-fungicide or copper spray.",
        prevention: "Provide adequate nitrogen fertilization, avoid overhead watering, and rotate crops every 3 years."
    },
    "Potato___Late_Blight": {
        plant: "Potato",
        leaf: "Potato Leaf",
        disease: "Late Blight",
        symptoms: "Dark water-soaked blotches on foliage leading to rapid leaf collapse.",
        solution: "Remove severely infected plants immediately and apply systemic metalaxyl or copper fungicide.",
        prevention: "Use certified disease-free seed tubers and plant resistant varieties."
    }
};

function getPrediction() {
    const result = localStorage.getItem("predictionResult");
    if (!result) return null;
    try {
        return JSON.parse(result);
    } catch (error) {
        console.error("Prediction data parse error:", error);
        return null;
    }
}

function getDiseaseData(prediction) {
    if (!prediction) return null;

    const plant = prediction.plant_name || prediction.plant || "Plant";
    const diseaseRaw = prediction.disease || prediction.prediction || "Healthy";

    const normalizedPlant = plant.trim().replace(/\s+/g, " ");
    const normalizedDisease = diseaseRaw.trim().replace(/_/g, " ").replace(/\s+/g, "_");
    const key = normalizedPlant + "___" + normalizedDisease;

    if (diseaseDatabase[key]) {
        return diseaseDatabase[key];
    }

    // Try case-insensitive matching in database
    const lowerKey = key.toLowerCase();
    for (const dbKey in diseaseDatabase) {
        if (dbKey.toLowerCase() === lowerKey) {
            return diseaseDatabase[dbKey];
        }
    }

    // Robust dynamic fallback so ALL plants and diseases (including custom backend predictions) work seamlessly!
    const displayPlant = normalizedPlant;
    const displayDisease = diseaseRaw.replace(/_/g, " ");
    const isHealthy = displayDisease.toLowerCase().includes("healthy");

    return {
        plant: displayPlant,
        leaf: displayPlant + " Leaf",
        disease: displayDisease,
        symptoms: prediction.symptoms || (isHealthy
            ? "The leaf appears healthy with vibrant green color and no visible lesions."
            : `Foliage shows symptoms of ${displayDisease}, including irregular dark lesions or spots.`),
        solution: prediction.solution || (isHealthy
            ? `The ${displayPlant} plant is in good health. Continue standard watering and nutrient management.`
            : `Prune infected ${displayPlant} foliage, improve ventilation around the canopy, avoid overhead watering, and apply appropriate treatment for ${displayDisease}.`),
        prevention: prediction.prevention || (isHealthy
            ? "Maintain optimal soil moisture and regularly inspect leaf undersides."
            : `Practice crop rotation, ensure good plant spacing for airflow, and clean garden tools after use.`)
    };
}

function createVoiceResponse(prediction) {
    const diseaseData = getDiseaseData(prediction);
    if (!diseaseData) {
        return "I could not find detailed information for this prediction. Please try analyzing an image first.";
    }

    const confidence = Number(prediction.confidence || 0).toFixed(1);

    if (diseaseData.disease.toLowerCase() === "healthy") {
        return `Hello. I am your AgriVision AI assistant. The detected plant is ${diseaseData.plant}. According to the Deep Neural Network, the ${diseaseData.leaf} is healthy with a confidence of ${confidence} percent. ${diseaseData.symptoms} Recommended care: ${diseaseData.solution} Prevention: ${diseaseData.prevention}`;
    }

    return `Hello. I am your AgriVision AI assistant. The detected plant is ${diseaseData.plant}. The diagnosis is ${diseaseData.disease} with a DNN confidence of ${confidence} percent. Symptoms: ${diseaseData.symptoms}. Recommended solution: ${diseaseData.solution}. Prevention: ${diseaseData.prevention}. Please monitor your plant regularly.`;
}

function speak(text) {
    if (!("speechSynthesis" in window)) {
        const statusEl = document.getElementById("voiceStatus");
        if (statusEl) statusEl.textContent = "Voice speech is not supported in this browser.";
        return;
    }

    // Cancel active speech and resume if paused
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }

    const cleanText = text.replace(/[*#_`]/g, "").replace(/\s+/g, " ").trim();
    const message = new SpeechSynthesisUtterance(cleanText);

    message.rate = 0.92;
    message.pitch = 1.0;
    message.volume = 1.0;

    const statusEl = document.getElementById("voiceStatus");
    const voiceBtn = document.getElementById("voiceButton");

    // Load browser voices if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
        const preferredVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Online"))) || voices.find(v => v.lang.startsWith("en"));
        if (preferredVoice) message.voice = preferredVoice;
    }

    message.onstart = function() {
        if (statusEl) statusEl.textContent = "🔊 AI Assistant is speaking...";
        if (voiceBtn) voiceBtn.textContent = "🔊 Speaking...";
    };

    message.onend = function() {
        if (statusEl) statusEl.textContent = "🤖 AI Assistant ready";
        if (voiceBtn) voiceBtn.textContent = "🔊 Speak Result";
    };

    message.onerror = function(err) {
        console.warn("SpeechSynthesis error:", err);
        if (statusEl) statusEl.textContent = "🤖 AI Assistant ready";
        if (voiceBtn) voiceBtn.textContent = "🔊 Speak Result";
    };

    window.speechSynthesis.speak(message);
}

function speakPrediction() {
    const prediction = getPrediction();

    if (!prediction) {
        speak("There is no plant disease prediction available yet. Please upload a plant leaf image and click Analyze with DNN first.");
        return;
    }

    const response = createVoiceResponse(prediction);
    speak(response);
}

function stopVoice() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }

    const statusEl = document.getElementById("voiceStatus");
    const voiceBtn = document.getElementById("voiceButton");

    if (statusEl) statusEl.textContent = "🤖 AI Assistant ready";
    if (voiceBtn) voiceBtn.textContent = "🔊 Speak Result";
}

// Global voice assistant binding
window.AgriVisionVoice = {
    speakPrediction: speakPrediction,
    speak: speak,
    stop: stopVoice,
    getDiseaseData: getDiseaseData,
    diseaseDatabase: diseaseDatabase
};

// Ensure voices are loaded on Chrome/Edge
if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
