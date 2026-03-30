import urllib.request
import json
import sys

req_data = json.dumps({
    "model": "llama3-8b-8192",
    "messages": [
        { "role": "system", "content": "You are a test." },
        { "role": "user", "content": "hi" }
    ],
    "max_tokens": 150
}).encode('utf-8')

req = urllib.request.Request(
    'https://api.groq.com/openai/v1/chat/completions',
    data=req_data,
    headers={
        'Authorization': 'Bearer YOUR_GROQ_API_KEY_HERE',
        'Content-Type': 'application/json'
    }
)
try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode('utf-8'))
    print(data['choices'][0]['message']['content'])
except Exception as e:
    print(f"Error: {str(e)}")
