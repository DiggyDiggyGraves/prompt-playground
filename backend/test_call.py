import httpx

print("Testing direct connection to Ollama...")
try:
    response = httpx.post(
        "http://127.0.0.1:11434/api/generate",
        json={
            "model": "phi3:latest",
            "prompt": "Say hello in 3 words.",
            "stream": False
        },
        timeout=60.0
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Failed with exception: {type(e).__name__}: {e}")
