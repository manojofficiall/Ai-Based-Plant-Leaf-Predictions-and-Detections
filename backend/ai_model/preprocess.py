import os
from PIL import Image
import torchvision.transforms as transforms

# Image transformations for Plant Leaf Deep Neural Network
IMAGE_SIZE = 224

train_transforms = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.1, contrast=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

eval_transforms = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

def load_and_preprocess_image(image_file_or_path):
    """
    Takes a file path, file object, or PIL Image and returns a normalized tensor.
    """
    if isinstance(image_file_or_path, (str, os.PathLike)):
        image = Image.open(image_file_or_path).convert('RGB')
    elif hasattr(image_file_or_path, 'read'):
        image = Image.open(image_file_or_path).convert('RGB')
    elif isinstance(image_file_or_path, Image.Image):
        image = image_file_or_path.convert('RGB')
    else:
        raise ValueError(f"Unsupported image input type: {type(image_file_or_path)}")

    tensor = eval_transforms(image).unsqueeze(0)  # Shape: (1, 3, 224, 224)
    return tensor
