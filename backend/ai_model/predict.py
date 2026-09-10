import os
import json
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
from ai_model.preprocess import load_and_preprocess_image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "model", "plant_disease_model.pth")
CLASS_NAMES_PATH = os.path.join(BASE_DIR, "model", "class_names.json")

# Knowledge database for solutions and prevention
DISEASE_KNOWLEDGE = {
    "Tomato___Healthy": {
        "plant": "Tomato",
        "disease": "Healthy",
        "symptoms": "The leaf appears vibrant green with no visible lesions, yellowing, or spots.",
        "solution": "The tomato plant is in optimal health. Continue standard watering and soil nutrient management.",
        "prevention": "Ensure adequate air circulation, avoid wet foliage, and monitor regularly."
    },
    "Tomato___Early_Blight": {
        "plant": "Tomato",
        "disease": "Early Blight",
        "symptoms": "Concentric circular dark brown/black spots with yellow halo on older leaves.",
        "solution": "Prune and dispose of lower infected leaves. Apply copper-based fungicide or neem oil spray.",
        "prevention": "Rotate crops every 2-3 years, use drip irrigation instead of overhead watering, and mulch around the base."
    },
    "Tomato___Late_Blight": {
        "plant": "Tomato",
        "disease": "Late Blight",
        "symptoms": "Large, irregular water-soaked pale green or dark brown lesions, with white fungal growth underneath in humid conditions.",
        "solution": "Immediately remove and destroy affected plant tissue. Treat with registered chlorothalonil or copper fungicide.",
        "prevention": "Avoid wet leaves, space plants generously for airflow, and avoid planting near potatoes."
    },
    "Potato___Healthy": {
        "plant": "Potato",
        "disease": "Healthy",
        "symptoms": "Uniform green foliage, firm stems, and no signs of bacterial or fungal damage.",
        "solution": "The potato plant is healthy. Maintain balanced moisture and hill soil around stems as tubers develop.",
        "prevention": "Maintain weed-free beds, inspect undersides of leaves weekly, and test soil fertility."
    },
    "Potato___Early_Blight": {
        "plant": "Potato",
        "disease": "Early Blight",
        "symptoms": "Target-board circular spots with concentric rings, surrounded by chlorotic yellowing.",
        "solution": "Remove heavily diseased foliage. Apply protective bio-fungicides or mancozeb/chlorothalonil sprays.",
        "prevention": "Provide adequate nitrogen fertilization, practice 3-year crop rotation, and avoid overhead sprinkler irrigation."
    },
    "Potato___Late_Blight": {
        "plant": "Potato",
        "disease": "Late Blight",
        "symptoms": "Fast-spreading dark brown water-soaked blotches on leaves and stems, leading to foliage collapse.",
        "solution": "Destroy severely infected plants immediately to prevent spore dispersal. Apply systemic metalaxyl-based fungicide.",
        "prevention": "Use certified disease-free seed tubers, plant resistant potato varieties, and eliminate volunteer potato weeds."
    }
}

CLASS_NAME_MAP = {
    "potato_early": ("Potato", "Early_Blight"),
    "potato_healthy": ("Potato", "Healthy"),
    "potato_bright": ("Potato", "Healthy"),
    "potato_late": ("Potato", "Late_Blight"),
    "tomato_early": ("Tomato", "Early_Blight"),
    "tomato_healthy": ("Tomato", "Healthy"),
    "tomato_bright": ("Tomato", "Healthy"),
    "tomato_late": ("Tomato", "Late_Blight")
}

_model = None
_class_names = []

def get_model():
    global _model, _class_names
    if _model is not None:
        return _model, _class_names
    
    # Load class names
    if os.path.exists(CLASS_NAMES_PATH):
        with open(CLASS_NAMES_PATH, "r") as f:
            raw_map = json.load(f)
            _class_names = [raw_map[str(i)] for i in range(len(raw_map))]
    else:
        _class_names = ["potato_early", "potato_healthy", "potato_late", "tomato_early", "tomato_healthy", "tomato_late"]

    # Build model architecture
    from ai_model.train import build_model
    model = build_model(num_classes=len(_class_names))
    
    if os.path.exists(MODEL_PATH):
        try:
            state_dict = torch.load(MODEL_PATH, map_location=torch.device("cpu"))
            model.load_state_dict(state_dict)
            print(f"✅ Loaded trained plant disease model from {MODEL_PATH}")
        except Exception as e:
            print(f"⚠️ Could not load saved weights: {e}")
            
    model.eval()
    _model = model
    return _model, _class_names

def predict_plant_disease(image_file):
    """
    Takes an uploaded leaf image, runs it through the Deep Neural Network,
    and returns comprehensive disease diagnosis and recommendations.
    """
    model, class_names = get_model()
    
    # Preprocess image into tensor
    input_tensor = load_and_preprocess_image(image_file)
    
    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = F.softmax(outputs, dim=1)[0]
        
        confidence_val, pred_idx = torch.max(probabilities, dim=0)
        confidence_pct = round(float(confidence_val.item()) * 100.0, 1)
        predicted_class = class_names[pred_idx.item()]
        
    # Map class name to Plant & Disease
    if predicted_class in CLASS_NAME_MAP:
        plant, disease = CLASS_NAME_MAP[predicted_class]
    else:
        parts = predicted_class.split("_", 1)
        plant = parts[0].capitalize()
        disease = parts[1].replace("_", " ").title() if len(parts) > 1 else "Healthy"
        
    key = f"{plant}___{disease}"
    info = DISEASE_KNOWLEDGE.get(key, {
        "plant": plant,
        "disease": disease.replace("_", " "),
        "symptoms": "Leaf symptoms identified by Deep Neural Network.",
        "solution": "Inspect plant foliage closely and apply appropriate cultural or organic care.",
        "prevention": "Ensure good air circulation, clean tools, and proper irrigation."
    })
    
    return {
        "plant": plant,
        "plant_name": plant,
        "disease": disease.replace("_", " "),
        "confidence": confidence_pct,
        "symptoms": info["symptoms"],
        "solution": info["solution"],
        "prevention": info["prevention"],
        "raw_class": predicted_class
    }
