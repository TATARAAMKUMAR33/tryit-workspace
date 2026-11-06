import os, requests
from dotenv import load_dotenv
load_dotenv()
u = os.getenv('SUPABASE_URL')
k = os.getenv('SUPABASE_KEY')
h = {'apikey': k, 'Authorization': f'Bearer {k}'}
r = requests.get(f'{u}/rest/v1/topics?select=subject_id', headers={**h,'Prefer':'count=exact','Range':'0-0'}, timeout=10)
print('Total topics:', r.headers.get('content-range','?').split('/')[-1])
r2 = requests.get(f'{u}/rest/v1/topics?select=subject_id&limit=2000', headers=h).json()
from collections import Counter
subjects = Counter(t.get('subject_id') for t in r2)
print(f'Total subjects with topics: {len(subjects)}')
