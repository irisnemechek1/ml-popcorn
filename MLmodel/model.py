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

# unlabeled = pd.read_csv(
#     "popcorn_dashboard\MLmodel\kaggledata\unlabeledTrainData.tsv",
#     sep="\t",
#     quoting=3,             # ignore quote characters
#     on_bad_lines="skip",   # skip malformed lines
#     engine="python"        # more stable for weird TSVs
# )


print(train.shape, test.shape)
train.head()
# unlabeled.head()

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


# #test on unlabeled 
# unlabeled["clean_review"] = unlabeled["review"].apply(clean_text)

# # ---- VECTORIZE USING TRAINED TFIDF ----
# X_unlabeled_vec = vectorizer.transform(unlabeled["clean_review"])

# # ---- PREDICT ----
# unlabeled_preds = model.predict_proba(X_unlabeled_vec)[:, 1]

# # ---- STORE RESULTS ----
# unlabeled["sentiment_probability"] = unlabeled_preds
# unlabeled["sentiment_score"] = unlabeled_preds * 100
# unlabeled["sentiment_label"] = (unlabeled_preds >= 0.5).astype(int)

# # Preview
# print(unlabeled[0:100])


# def predict_sentiment(text):
#     clean = clean_text(text)
#     vec = vectorizer.transform([clean])
#     prob = model.predict_proba(vec)[0,1]
#     return prob * 100

