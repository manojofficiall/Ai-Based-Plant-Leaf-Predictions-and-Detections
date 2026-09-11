# AgriVision AI

AI-based plant disease detection system using Deep Neural Networks.

AgriVision AI allows users to upload tomato or potato leaf images and detect possible plant diseases. The application provides disease predictions, confidence scores, recommendations, and voice assistance.

## Features

- Plant disease detection using a trained AI model
- Supports tomato and potato leaves
- Detects early blight, late blight, and healthy plants
- Confidence score for predictions
- AI-generated disease recommendations
- Voice assistant support
- Login and dashboard interface
- Detection history
- Grad-CAM heatmap support

## Project Structure

```text
project/
├── backend/
│   ├── ai_assistant/
│   ├── ai_model/
│   ├── django_project/
│   ├── plant_detection/
│   ├── model/
│   │   ├── class_names.json
│   │   └── plant_disease_model.pth
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── assets/
    ├── css/
    ├── js/
    ├── pages/
    └── index.html

Deployment
The frontend can be deployed on Netlify.

The Django backend must be deployed separately using a Python hosting platform such as:

Render
Railway
PythonAnywhere
After deploying the backend, update the frontend API URL to use the public backend URL.

Technologies Used
HTML
CSS
JavaScript
Node.js
Django
Django REST Framework
Python
PyTorch
NumPy
Pillow
Google OAuth
Web Speech API

Author
Manoj Official

