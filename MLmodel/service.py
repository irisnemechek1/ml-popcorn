import joblib
import re
import sys
import json
import os

# ---- LOAD TRAINED MODEL ----
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model_path = os.path.join(BASE_DIR, "logreg_model.pkl")
vectorizer_path = os.path.join(BASE_DIR, "tfidf_vectorizer.pkl")

model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)

# ---- CLEANING FUNCTION ----
def clean_text(text):
    text = re.sub("<.*?>", "", text)
    text = re.sub("[^a-zA-Z]", " ", text)
    return text.lower()

# ---- PREDICTION FUNCTION ----
def predict_sentiment(text):
    clean = clean_text(text)
    vec = vectorizer.transform([clean])
    prob = model.predict_proba(vec)[0,1]
    return prob * 100

# ---- SCRIPT MODE (called from C# subprocess) ----
if __name__ == "__main__":
    text = sys.argv[1]
    score = predict_sentiment(text)
    # output JSON for safe parsing
    print(json.dumps({"score": score}))
