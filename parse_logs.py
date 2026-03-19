import json

with open('C:/Users/Prem/.gemini/antigravity/brain/d8745872-f985-47ed-bba1-72616900a367/.system_generated/steps/129/output.txt', 'r') as f:
    data = json.load(f)
    results = data.get('result', {}).get('result', [])
    for entry in results:
        if entry.get('status_code') == 400:
            print(json.dumps(entry, indent=2))
        if 'error' in entry.get('event_message', '').lower() or 'fail' in entry.get('event_message', '').lower():
            print(json.dumps(entry, indent=2))
