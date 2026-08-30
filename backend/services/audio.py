import os
from gtts import gTTS
import uuid
from backend.services import ai

# Ensure static folder exists
STATIC_AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "audio")
os.makedirs(STATIC_AUDIO_DIR, exist_ok=True)

# Language configurations for gTTS
LANG_MAP = {
    "english": "en",
    "hindi": "hi",
    "bengali": "bn",
    "gujarati": "gu",
    "kannada": "kn",
    "malayalam": "ml",
    "marathi": "mr",
    "punjabi": "pa",
    "tamil": "ta",
    "telugu": "te"
}

# Simple default spoken text scripts for each language in case of mock/no-keys
MOCK_SCRIPTS = {
    "en": "Hello! Welcome to your Audio Overview. Today we are discussing your uploaded study materials. The core focus explores key scientific theories, structural components, and how these shape our broader understanding of the subject. Let's delve into the detailed points outlined in your notes.",
    "hi": "नमस्ते! आपके ऑडियो सारांश में आपका स्वागत है। आज हम आपकी अध्ययन सामग्री के बारे में चर्चा कर रहे हैं। मुख्य रूप से हम वैज्ञानिक सिद्धांतों और उनकी कार्यप्रणाली को समझेंगे। आइए आपकी टिप्पणियों में दिए गए विवरणों को गहराई से देखें।",
    "bn": "নমস্কার! আপনার অডিও ওভারভিউতে স্বাগতম। আজ আমরা আপনার আপলোড করা অধ্যয়ন সামগ্রী নিয়ে আলোচনা করছি। মূল ফোকাসটি বৈজ্ঞানিক তত্ত্ব এবং কাঠামোগত উপাদানগুলির উপর। আসুন আপনার নোটগুলিতে বর্ণিত বিস্তারিত বিষয়গুলি খতিয়ে দেখি।",
    "gu": "નમસ્તે! તમારા ઓડિયો સારાંશમાં આપનું સ્વાગત છે. આજે આપણે તમારા અપલોડ કરેલા અભ્યાસ મટિરિયલ વિશે ચર્ચા કરી રહ્યા છીએ. આ વિષયના મુખ્ય સિદ્ધાંતો અને રચનાઓ વિશે આપણે વિગતે સમજીશું. ચાલો તમારા નોટ્સમાં આપેલ વિગતો જોઈએ.",
    "kn": "ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಆಡಿಯೊ ಅವಲೋಕನಕ್ಕೆ ಸುಸ್ವಾಗತ. ಇಂದು ನಾವು ನಿಮ್ಮ ಅಧ್ಯಯನ ಸಾಮಗ್ರಿಗಳ ಬಗ್ಗೆ ಚರ್ಚಿಸುತ್ತಿದ್ದೇವೆ. ನಿಮ್ಮ ಟಿಪ್ಪಣಿಗಳಲ್ಲಿ ವಿವರಿಸಲಾದ ಪ್ರಮುಖ ವೈಜ್ಞಾನಿಕ ಸಿದ್ಧಾಂತಗಳು ಮತ್ತು ವಿವರಗಳನ್ನು ಈಗ ಆಲಿಸೋಣ.",
    "ml": "നമസ്കാരം! നിങ്ങളുടെ ഓഡിയോ അവലോകനത്തിലേക്ക് സ്വാഗതം. ഇന്ന് നമ്മൾ നിങ്ങളുടെ പഠന സാമഗ്രികളെക്കുറിച്ചാണ് ചർച്ച ചെയ്യുന്നത്. നിങ്ങളുടെ കുറിപ്പുകളിൽ പറഞ്ഞിരിക്കുന്ന പ്രധാന ശാസ്ത്രീയ സിദ്ധാന്തങ്ങളെയും വിശദാംശങ്ങളെയും നമുക്ക് പരിശോധിക്കാം.",
    "mr": "नमस्कार! तुमच्या ऑडिओ सारांशामध्ये तुमचे स्वागत आहे. आज आपण तुमच्या अभ्यास साहित्याबद्दल चर्चा करत आहोत. तुमच्या नोट्समध्ये वर्णन केलेल्या प्रमुख वैज्ञानिक सिद्धांतांचा आणि तपशीलांचा आता आपण अभ्यास करूया.",
    "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡੇ ਆਡੀਓ ਸਾਰਾਂਸ਼ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਅੱਜ ਅਸੀਂ ਤੁਹਾਡੀ ਅਧਿਐਨ ਸਮੱਗਰੀ ਬਾਰੇ ਚਰਚਾ ਕਰ ਰਹੇ ਹਾਂ। ਆਓ ਤੁਹਾਡੇ ਨੋਟਸ ਵਿੱਚ ਦਿੱਤੇ ਗਏ ਮੁੱਖ ਸਿਧਾਂਤਾਂ ਅਤੇ ਵੇਰਵਿਆਂ ਨੂੰ ਸਮਝੀਏ।",
    "ta": "வணக்கம்! உங்கள் ஆடியோ சுருக்கத்திற்கு உங்களை வரவேற்கிறோம். இன்று நாம் உங்கள் ஆய்வுப் பொருட்கள் பற்றி விவாதிக்கிறோம். உங்கள் குறிப்புகளில் விவரிக்கப்பட்டுள்ள முக்கிய அறிவியல் கோட்பாடுகள் மற்றும் விவரங்களை இப்போது விரிவாகக் கேட்போம்.",
    "te": "నమస్కారం! మీ ఆడియో సారాంశానికి స్వాగతం. ఈరోజు మనం మీ అధ్యయన సామగ్రి గురించి చర్చించుకుంటున్నాము. మీ నోట్స్ లో వివరించిన ముఖ్యమైన వైజ్ఞానిక సిద్ధాంతాలు మరియు వివరాలను ఇప్పుడు తెలుసుకుందాం."
}

def generate_audio_overview(content: str, language_name: str) -> str:
    """
    Generates a spoken podcast/audio overview of the content in the target language.
    Returns the file name of the saved MP3 inside static/audio/.
    """
    lang_code = LANG_MAP.get(language_name.lower(), "en")
    
    script_text = ""
    
    if ai.GEMINI_KEY:
        try:
            # Generate script using Gemini in the target language
            prompt = f"""You are a friendly podcast host and educational tutor. Write a short, engaging 1-minute audio explanation script in the language matching code '{lang_code}' explaining the following text. 
            Do NOT include any stage directions, speaker labels, bracketed texts, or titles. Just output the spoken script itself so it can be directly fed into a Text-To-Speech engine.
            
            Text:
            {content[:6000]}"""
            
            script_text = ai.query_gemini(prompt).strip()
            # Clean up markdown formatting if the model output them
            script_text = script_text.replace("**", "").replace("*", "").replace("#", "")
        except Exception as e:
            print(f"Gemini script translation failed: {e}")
            script_text = MOCK_SCRIPTS.get(lang_code, MOCK_SCRIPTS["en"])
    else:
        # Fallback to local script
        script_text = MOCK_SCRIPTS.get(lang_code, MOCK_SCRIPTS["en"])
        
    # Generate TTS
    try:
        tts = gTTS(text=script_text, lang=lang_code, slow=False)
        filename = f"audio_{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(STATIC_AUDIO_DIR, filename)
        tts.save(filepath)
        return filename
    except Exception as e:
        print(f"gTTS saving failed: {e}")
        # Return a fallback file or error
        raise e
