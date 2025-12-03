# Import all necessary libraries for regression analysis
import pandas as pd
import re
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, accuracy_score, confusion_matrix


#load data 
train = pd.read_csv("kaggledata/labeledTrainData.tsv", sep="\t")
test = pd.read_csv("kaggledata/testData.tsv", sep="\t")


print(train.shape, test.shape)
train.head()

#clean data
import re

def clean_text(text):
    text = re.sub("<.*?>", "", text)  # remove HTML tags
    text = re.sub("[^a-zA-Z]", " ", text)  # keep letters only
    text = text.lower()
    return text

train["clean_review"] = train["review"].apply(clean_text)

#train data
X_train, X_val, y_train, y_val = train_test_split(
    train["clean_review"], train["sentiment"], test_size=0.2, random_state=42
)

vectorizer = TfidfVectorizer(max_features=20000)
X_train_vec = vectorizer.fit_transform(X_train)
X_val_vec = vectorizer.transform(X_val)

model = LogisticRegression(max_iter=200)
model.fit(X_train_vec, y_train)

preds = model.predict_proba(X_val_vec)[:, 1]
auc = roc_auc_score(y_val, preds)
auc

sentiment_score = preds * 100  # 0-100 scale
y_pred = (preds >= 0.5).astype(int)
print("Accuracy:", accuracy_score(y_val, y_pred))
print("Confusion Matrix:\n", confusion_matrix(y_val, y_pred))

#save trained model(dont have to retrain)
import joblib

joblib.dump(model, "logreg_model.pkl")
joblib.dump(vectorizer, "tfidf_vectorizer.pkl")

