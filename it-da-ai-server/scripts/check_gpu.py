# scripts/check_gpu.py
"""
GPU 및 CUDA 설치 상태 확인
"""
import sys

print("=" * 70)
print("🔍 GPU 환경 확인")
print("=" * 70)

# 1. Python 버전
print(f"\n1. Python 버전: {sys.version}")

# 2. PyTorch 확인
try:
    import torch
    print(f"\n2. PyTorch 버전: {torch.__version__}")
    print(f"   CUDA 지원: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"   CUDA 버전: {torch.version.cuda}")
        print(f"   GPU 개수: {torch.cuda.device_count()}")
        for i in range(torch.cuda.device_count()):
            print(f"   GPU {i}: {torch.cuda.get_device_name(i)}")
            props = torch.cuda.get_device_properties(i)
            print(f"      메모리: {props.total_memory / 1e9:.1f}GB")
            print(f"      Compute Capability: {props.major}.{props.minor}")
    else:
        print("   ❌ CUDA 사용 불가")
        print("   → PyTorch가 CPU 버전으로 설치되었거나")
        print("   → NVIDIA 드라이버/CUDA가 설치 안 됨")
except ImportError:
    print("\n2. PyTorch 설치 안 됨")

# 3. NVIDIA 드라이버 확인 (Windows)
print("\n3. NVIDIA 드라이버 확인...")
import subprocess
try:
    result = subprocess.run(
        ["nvidia-smi"],
        capture_output=True,
        text=True,
        timeout=5
    )
    if result.returncode == 0:
        print("   ✅ NVIDIA 드라이버 설치됨")
        print("\n" + result.stdout)
    else:
        print("   ❌ nvidia-smi 실행 실패")
except FileNotFoundError:
    print("   ❌ nvidia-smi 없음 (NVIDIA 드라이버 미설치)")
except Exception as e:
    print(f"   ❌ 에러: {e}")

# 4. Transformers 확인
try:
    import transformers
    print(f"\n4. Transformers 버전: {transformers.__version__}")
except ImportError:
    print("\n4. Transformers 설치 안 됨")

# 5. 해결 방법
print("\n" + "=" * 70)
print("📋 해결 방법")
print("=" * 70)

try:
    import torch
    if not torch.cuda.is_available():
        print("\n⚠️ CUDA를 사용할 수 없습니다!")
        print("\n해결 방법:")
        print("1. NVIDIA GPU가 있는지 확인")
        print("2. NVIDIA 드라이버 설치")
        print("   https://www.nvidia.com/Download/index.aspx")
        print("3. CUDA Toolkit 설치")
        print("   https://developer.nvidia.com/cuda-downloads")
        print("4. PyTorch CUDA 버전 재설치:")
        print("   pip uninstall torch")
        print("   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121")
    else:
        print("\n✅ GPU 사용 가능!")
except:
    pass

print("=" * 70)