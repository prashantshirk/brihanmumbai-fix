"""
Quick test script to verify Gemini API key works (REST API)
Run: python test_gemini.py
"""
import os
import requests
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found in .env file")
    exit(1)

print(f"✅ Found API key: {GEMINI_API_KEY[:10]}...")
print(f"📏 Key length: {len(GEMINI_API_KEY)} characters")

models_to_test = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
]


def build_api_url(model_id: str) -> str:
    return f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={GEMINI_API_KEY}"


def extract_text(response_json: dict) -> str:
    try:
        return response_json['candidates'][0]['content']['parts'][0]['text']
    except Exception:
        return str(response_json)

try:
    # Test 1: Simple text prompt
    print("\n🧪 TEST 1: Simple Text Generation (all models)")
    print("=" * 50)
    
    payload = {
        "contents": [{
            "parts": [{"text": "Say 'Hello, I am working!' in exactly 5 words."}]
        }]
    }

    text_success_models = []
    for model_id in models_to_test:
        print(f"\n🤖 Testing model: {model_id}")
        try:
            response = requests.post(build_api_url(model_id), json=payload, timeout=10)
            print(f"📥 Response status: {response.status_code}")
            if response.status_code == 200:
                text = extract_text(response.json())
                print(f"✅ Text response: {text}")
                text_success_models.append(model_id)
            else:
                print(f"❌ Error body: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {type(e).__name__}: {e}")
    
    # Test 2: Image analysis
    print("\n🧪 TEST 2: Image Analysis (all models)")
    print("=" * 50)
    
    # Ask user for a local image file
    print("\n📷 Please provide a local image file to test.")
    print("Example: C:\\Users\\YourName\\Pictures\\pothole.jpg")
    image_path = input("Enter full path to image file (or press Enter to skip): ").strip()
    
    if not image_path:
        print("⏭️ Skipping image test.")
        print(f"\n✅ Text-test successful models: {text_success_models if text_success_models else 'None'}")
        exit(0)
    
    # Remove quotes if user copied path with quotes
    image_path = image_path.strip('"').strip("'")
    
    print(f"\n📥 Reading image from: {image_path}")
    
    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        print(f"✅ Image loaded: {len(image_data)} bytes")
        
        # Convert to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        print(f"✅ Image encoded to base64: {len(image_base64)} chars")
        
        if len(image_base64) < 1000:
            print(f"⚠️ WARNING: Base64 image seems small ({len(image_base64)} chars)")
    
    except FileNotFoundError:
        print(f"❌ File not found: {image_path}")
        print("Please check the path and try again")
        exit(1)
    except Exception as e:
        print(f"❌ Error reading image: {str(e)}")
        exit(1)
    
    prompt = """You are a civic issue classifier for Mumbai's BMC.
Analyze this image and return ONLY valid JSON with this exact structure:
{
  "issue_type": "<one of: Pothole, Garbage/Waste, Water Leakage, Broken Streetlight, Other>",
  "severity": "<one of: Low, Medium, High, Critical>",
  "description": "<2-3 sentence factual description of what you see>",
  "department": "<one of: Roads Department, Solid Waste Management, Water Supply, Street Lighting, General>",
  "confidence": <number 0-100>
}
Do not include any text outside the JSON."""
    
    vision_payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_base64
                    }
                }
            ]
        }]
    }

    vision_success_models = []
    for model_id in models_to_test:
        print(f"\n🤖 Testing image analysis with model: {model_id}")
        try:
            vision_response = requests.post(build_api_url(model_id), json=vision_payload, timeout=30)
            print(f"📥 Response status: {vision_response.status_code}")
            if vision_response.status_code == 200:
                vision_text = extract_text(vision_response.json())
                print(f"✅ Vision response:\n{vision_text}\n")
                vision_success_models.append(model_id)
            else:
                print(f"❌ Error body: {vision_response.text}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {type(e).__name__}: {e}")

    print("\n📊 SUMMARY")
    print("=" * 50)
    print(f"✅ Text-test successful models: {text_success_models if text_success_models else 'None'}")
    print(f"✅ Vision-test successful models: {vision_success_models if vision_success_models else 'None'}")
    
except requests.exceptions.Timeout:
    print("\n❌ ERROR: Request timed out")
    print("The API might be slow or unreachable")
except requests.exceptions.RequestException as e:
    print(f"\n❌ Network Error: {str(e)}")
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    print("\n🔧 Troubleshooting:")
    print("1. Check if your API key is correct")
    print("2. Make sure you accepted Google AI Studio terms")
    print("3. Try generating a new API key at https://aistudio.google.com/app/apikey")
    print("4. Check if you have internet connection")

