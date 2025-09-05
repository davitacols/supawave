import requests

# Test if backend is accessible from network
try:
    response = requests.get('http://192.168.0.183:8000/api/auth/login/')
    print(f"Backend accessible: {response.status_code}")
except Exception as e:
    print(f"Backend not accessible: {e}")

# Test CORS
try:
    response = requests.options('http://192.168.0.183:8000/api/auth/login/', 
                              headers={'Origin': 'http://192.168.0.183:3000'})
    print(f"CORS test: {response.status_code}")
    print(f"CORS headers: {response.headers}")
except Exception as e:
    print(f"CORS test failed: {e}")