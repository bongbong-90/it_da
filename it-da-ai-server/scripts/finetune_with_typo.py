"""
KcELECTRA 감성 분석 모델 Fine-tuning (오타/신조어 대응)
최신 transformers 버전 호환
"""

import os
import torch
import numpy as np
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    DataCollatorWithPadding
)
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import random

# ========================================
# 설정
# ========================================

# 기본 모델 (HuggingFace)
BASE_MODEL = "beomi/KcELECTRA-base-v2022"

# 경로 설정
MODEL_PATH = "./models/kcelectra_sentiment_finetuned"
AUGMENTED_DATA_PATH = "./data/nsmc/ratings_train_augmented.txt"
TEST_DATA_PATH = "./data/nsmc/ratings_test.txt"
OUTPUT_DIR = "./models/kcelectra_sentiment_with_typo"

# Fine-tuning 파라미터
BATCH_SIZE = 16
EPOCHS = 3
LEARNING_RATE = 2e-5
MAX_LENGTH = 128

# ========================================
# 1. 데이터 증강 (오타/신조어 추가)
# ========================================

def augment_with_typo(text, prob=0.15):
    """오타 및 신조어 증강"""

    slang_dict = {
        "좋다": ["굿", "좋음", "조음", "조타", "조아"],
        "최고": ["최고임", "쩐다", "레전드"],
        "재미있다": ["재밌다", "잼", "잼있음", "잼따"],
        "별로": ["별루", "노잼"],
        "최악": ["최악임", "최악이다", "레알최악"],
        "영화": ["영화임", "무비"],
        "감동": ["감동임", "감동적", "감동이야"],
        "진짜": ["레알", "ㄹㅇ", "리얼"],
        "정말": ["진ㅁ자", "정ㅁ말"],
    }

    if random.random() < prob:
        for word, slangs in slang_dict.items():
            if word in text:
                text = text.replace(word, random.choice(slangs))

    if random.random() < prob * 0.5:
        words = text.split()
        if len(words) > 1:
            idx = random.randint(0, len(words) - 2)
            words[idx] = words[idx] + words[idx + 1]
            words.pop(idx + 1)
            text = " ".join(words)

    return text

def create_augmented_dataset():
    """증강 데이터셋 생성"""

    print("=" * 70)
    print("📊 오타/신조어 데이터 증강")
    print("=" * 70)

    data_path = "./data/nsmc/ratings_train.txt"

    if not os.path.exists(data_path):
        print(f"⚠️ NSMC 데이터가 없습니다: {data_path}")
        print("💡 python download_nsmc.py 실행하세요")
        raise FileNotFoundError(f"NSMC 데이터가 없습니다: {data_path}")

    texts = []
    labels = []

    with open(data_path, 'r', encoding='utf-8') as f:
        next(f)
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) == 3:
                _, text, label = parts
                texts.append(text)
                labels.append(int(label))

    print(f"\n원본 데이터: {len(texts):,}개")

    augment_ratio = 0.3
    n_augment = int(len(texts) * augment_ratio)

    augmented_texts = []
    augmented_labels = []

    indices = random.sample(range(len(texts)), n_augment)

    for idx in indices:
        original_text = texts[idx]
        augmented_text = augment_with_typo(original_text, prob=0.2)
        augmented_texts.append(augmented_text)
        augmented_labels.append(labels[idx])

    all_texts = texts + augmented_texts
    all_labels = labels + augmented_labels

    print(f"\n✅ 증강 완료!")
    print(f"   원본: {len(texts):,}개")
    print(f"   증강: {len(augmented_texts):,}개")
    print(f"   전체: {len(all_texts):,}개")

    os.makedirs(os.path.dirname(AUGMENTED_DATA_PATH), exist_ok=True)

    with open(AUGMENTED_DATA_PATH, 'w', encoding='utf-8') as f:
        f.write("id\tdocument\tlabel\n")
        for i, (text, label) in enumerate(zip(all_texts, all_labels)):
            f.write(f"{i}\t{text}\t{label}\n")

    print(f"   저장: {AUGMENTED_DATA_PATH}")

    print("\n📋 증강 샘플:")
    for text, label in zip(augmented_texts[:5], augmented_labels[:5]):
        print(f"  {text} (label={label})")

    return all_texts, all_labels

# ========================================
# 2. 데이터 로딩
# ========================================

def load_local_nsmc(filepath):
    """로컬 NSMC 파일 로딩"""

    texts = []
    labels = []

    with open(filepath, 'r', encoding='utf-8') as f:
        next(f)
        for line in f:
            parts = line.strip().split('\t')
            if len(parts) == 3:
                _, text, label = parts
                texts.append(text)
                labels.append(int(label))

    return Dataset.from_dict({
        "text": texts,
        "label": labels
    })

def load_data():
    """증강 데이터 로딩"""

    if not os.path.exists(AUGMENTED_DATA_PATH):
        create_augmented_dataset()

    if not os.path.exists(TEST_DATA_PATH):
        print(f"⚠️ 테스트 데이터가 없습니다: {TEST_DATA_PATH}")
        print("💡 python download_nsmc.py 실행하세요")
        raise FileNotFoundError(f"테스트 데이터가 없습니다: {TEST_DATA_PATH}")

    print("  학습 데이터 로딩...")
    train_dataset = load_local_nsmc(AUGMENTED_DATA_PATH)

    print("  테스트 데이터 로딩...")
    test_dataset = load_local_nsmc(TEST_DATA_PATH)

    print(f"  학습: {len(train_dataset):,}개")
    print(f"  테스트: {len(test_dataset):,}개")

    return train_dataset, test_dataset

# ========================================
# 3. 모델 & Tokenizer 로딩
# ========================================

def load_model_and_tokenizer():
    """모델 로딩"""

    if os.path.exists(MODEL_PATH) and os.path.exists(os.path.join(MODEL_PATH, "config.json")):
        print(f"  기존 파인튠 모델 로딩: {MODEL_PATH}")
        model_path = MODEL_PATH
    else:
        print(f"  기본 모델 로딩: {BASE_MODEL}")
        model_path = BASE_MODEL

    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(
        model_path,
        num_labels=2
    )

    return tokenizer, model

# ========================================
# 4. Tokenization
# ========================================

def tokenize_dataset(dataset, tokenizer):
    """데이터셋 토크나이징"""

    def tokenize_function(examples):
        return tokenizer(
            examples["text"],
            truncation=True,
            max_length=MAX_LENGTH,
            padding=False
        )

    return dataset.map(tokenize_function, batched=True)

# ========================================
# 5. Fine-tuning
# ========================================

def compute_metrics(eval_pred):
    """평가 메트릭"""
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=1)

    accuracy = accuracy_score(labels, predictions)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, predictions, average='binary'
    )

    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }

def train():
    """Fine-tuning 실행"""

    print("=" * 70)
    print("🔧 오타/신조어 추가 Fine-tuning")
    print("=" * 70)

    # GPU 확인
    print("\n🖥️ GPU 확인:")
    if torch.cuda.is_available():
        print(f"  ✅ GPU 사용 가능")
        print(f"  GPU: {torch.cuda.get_device_name(0)}")
        print(f"  CUDA 버전: {torch.version.cuda}")
        print(f"  FP16: 활성화")
    else:
        print(f"  ⚠️ GPU 없음 - CPU로 학습 (느릴 수 있음)")

    print("\n[1/4] 데이터 증강...")
    if not os.path.exists(AUGMENTED_DATA_PATH):
        create_augmented_dataset()
    else:
        print(f"  기존 증강 데이터 사용: {AUGMENTED_DATA_PATH}")

    print("\n[2/4] 증강 데이터 로딩...")
    train_dataset, test_dataset = load_data()

    print("\n[3/4] 모델 로딩...")
    tokenizer, model = load_model_and_tokenizer()

    print("\n[4/4] Tokenization...")
    train_dataset = tokenize_dataset(train_dataset, tokenizer)
    test_dataset = tokenize_dataset(test_dataset, tokenizer)

    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    # Training Arguments (GPU 사용)
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=LEARNING_RATE,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        num_train_epochs=EPOCHS,
        weight_decay=0.01,
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        save_total_limit=2,
        logging_steps=100,
        # GPU 설정
        fp16=torch.cuda.is_available(),  # GPU 있으면 FP16 사용 ✅
        # use_cpu=False,  # CPU 강제 사용 안 함
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
    )

    print("\n" + "=" * 70)
    print("🚀 Fine-tuning 시작!")
    print("=" * 70)

    trainer.train()

    print("\n" + "=" * 70)
    print("📊 최종 평가")
    print("=" * 70)

    results = trainer.evaluate()

    for key, value in results.items():
        print(f"  {key}: {value:.4f}")

    print(f"\n💾 모델 저장: {OUTPUT_DIR}")
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    print("\n🎉 Fine-tuning 완료!")

if __name__ == "__main__":
    train()