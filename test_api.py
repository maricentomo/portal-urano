import requests
import json

url = "http://localhost:8000/chat"
headers = {"Content-Type": "application/json"}

# Dummy map data based on MapResult model
map_data = {
    "positions": [
        {"planet": "Sol", "sign": "Áries", "degree": 10.5, "house": 1, "retrograde": False},
        {"planet": "Lua", "sign": "Touro", "degree": 5.2, "house": 2, "retrograde": False}
    ],
    "houses": [
        {"house": 1, "sign": "Áries", "degree": 0.0},
        {"house": 2, "sign": "Touro", "degree": 30.0}
    ],
    "aspects": [],
    "elements": {"Fogo": 5, "Terra": 2, "Ar": 2, "Água": 1},
    "quadruplicities": {"Cardinal": 4, "Fixo": 3, "Mutável": 3}
}

data = {
    "message": "Faça a análise completa do meu mapa seguindo as instruções do sistema.",
    "history": [],
    "map_data": map_data
}

try:
    print("Sending request...")
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    if response.status_code != 200:
        print(f"Error Response: {response.text}")
    else:
        print("Response received successfully:")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
