import os
import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)

@csrf_exempt
def detect_disease(request):
    if request.method == "OPTIONS":
        response = JsonResponse({"status": "ok"})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Headers"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
        return response

    if request.method != "POST":
        return JsonResponse({"error": "Only POST requests are allowed"}, status=405)
    
    uploaded_file = request.FILES.get("image")
    if not uploaded_file:
        return JsonResponse({"error": "No image uploaded"}, status=400)
    
    try:
        from ai_model.predict import predict_plant_disease
        result = predict_plant_disease(uploaded_file)
    except Exception as e:
        logger.error(f"Error during AI model prediction: {e}", exc_info=True)
        return JsonResponse({
            "error": "Failed to process image with Deep Neural Network",
            "details": str(e)
        }, status=500)
        
    response = JsonResponse(result)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Headers"] = "*"
    response["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
    return response
