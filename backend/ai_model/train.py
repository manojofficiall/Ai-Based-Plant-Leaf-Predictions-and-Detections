import os
import sys
import time
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Subset
import torchvision.models as models
from torchvision.datasets import ImageFolder
from ai_model.preprocess import train_transforms, eval_transforms

# Force utf-8 encoding for standard output
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODEL_SAVE_PATH = os.path.join(BASE_DIR, "model", "plant_disease_model.pth")
CLASS_NAMES_PATH = os.path.join(BASE_DIR, "model", "class_names.json")

def build_model(num_classes=6):
    """
    Creates a Transfer Learning Deep Neural Network using MobileNetV2.
    """
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    # Freeze earlier feature layers for fast training
    for param in model.features[:-4].parameters():
        param.requires_grad = False
    
    # Replace final classifier layer
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.Dropout(p=0.2),
        nn.Linear(256, num_classes)
    )
    return model

def train_model(epochs=1, batch_size=32, lr=0.001, max_train_samples=3000):
    train_dir = os.path.join(DATASET_DIR, "train")
    val_dir = os.path.join(DATASET_DIR, "valid")
    
    if not os.path.exists(train_dir):
        raise FileNotFoundError(f"Train directory not found: {train_dir}")
    
    print("[INFO] Loading datasets...")
    full_train_dataset = ImageFolder(train_dir, transform=train_transforms)
    val_dataset = ImageFolder(val_dir, transform=eval_transforms)
    
    class_names = full_train_dataset.classes
    print(f"Detected classes: {class_names}")
    
    # Save class names mapping
    class_map = {str(i): name for i, name in enumerate(class_names)}
    with open(CLASS_NAMES_PATH, "w", encoding="utf-8") as f:
        json.dump(class_map, f, indent=2)
        
    # Sample balanced subset for fast fine-tuning
    if max_train_samples and len(full_train_dataset) > max_train_samples:
        indices = torch.randperm(len(full_train_dataset))[:max_train_samples].tolist()
        train_dataset = Subset(full_train_dataset, indices)
    else:
        train_dataset = full_train_dataset
        
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[INFO] Using device: {device}")
    print(f"[INFO] Training on {len(train_dataset)} images, validating on {len(val_dataset)} images...")
    
    model = build_model(num_classes=len(class_names)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=lr)
    
    best_acc = 0.0
    for epoch in range(epochs):
        start_time = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for i, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            if (i + 1) % 20 == 0:
                print(f"  Epoch [{epoch+1}/{epochs}] Step [{i+1}/{len(train_loader)}] Loss: {loss.item():.4f}")
                
        epoch_loss = running_loss / total
        epoch_acc = 100.0 * correct / total
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item() * images.size(0)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()
                
        val_acc = 100.0 * val_correct / val_total
        val_loss = val_loss / val_total
        elapsed = time.time() - start_time
        
        print(f"Epoch {epoch+1}/{epochs} ({elapsed:.1f}s) - Train Loss: {epoch_loss:.4f}, Train Acc: {epoch_acc:.2f}% | Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")
        
        if val_acc > best_acc or epoch == epochs - 1:
            best_acc = val_acc
            os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            print(f"[SUCCESS] Saved model weights to {MODEL_SAVE_PATH}")

    print("[SUCCESS] Training Complete!")

if __name__ == "__main__":
    train_model(epochs=1, batch_size=32, lr=0.001)
