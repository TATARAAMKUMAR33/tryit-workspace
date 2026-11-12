import os, requests, uuid, time
from dotenv import load_dotenv
load_dotenv()

u = os.getenv("SUPABASE_URL")
k = os.getenv("SUPABASE_KEY")
h = {
    "apikey": k,
    "Authorization": f"Bearer {k}",
    "Content-Type": "application/json",
    "Prefer": "resolution=ignore-duplicates"
}

def post_batch(endpoint, batch, retries=3):
    for attempt in range(retries):
        try:
            r = requests.post(f"{u}/rest/v1/{endpoint}", headers=h,
                            json=batch, timeout=60)
            return r
        except Exception as e:
            print(f"    Attempt {attempt+1} failed: {str(e)[:60]}")
            time.sleep(5 * (attempt+1))
    return None

# Step 1 - fetch exams
print("Fetching exams...")
exams = requests.get(f"{u}/rest/v1/exams?select=id,name,category&limit=1000",
                     headers=h, timeout=60).json()
print(f"Found {len(exams)} exams")

# Step 2 - insert into exam_registry
print("Inserting into exam_registry...")
registry_rows = [{
    "exam_id": e.get("id"),
    "exam_name": e.get("name", e.get("id","")),
    "conducting_body": "Various",
    "category": e.get("category","general"),
    "is_active": True,
    "research_status": "auto_imported"
} for e in exams]

ins = skip = err = 0
for i in range(0, len(registry_rows), 50):
    batch = registry_rows[i:i+50]
    r = post_batch("exam_registry", batch)
    if r is None: err += len(batch); continue
    if r.status_code in [200,201]: ins += len(batch); print(f"  Reg batch {i//50+1}: +{len(batch)}")
    elif r.status_code == 409: skip += len(batch)
    else: err += len(batch); print(f"  Reg batch {i//50+1}: ERR {r.status_code}: {r.text[:80]}")

print(f"Registry: {ins} inserted | {skip} skipped | {err} errors")

# Verify registry count
time.sleep(2)
r2 = requests.get(f"{u}/rest/v1/exam_registry?select=exam_id",
    headers={**h,"Prefer":"count=exact","Range":"0-0"}, timeout=30)
print(f"Registry total: {r2.headers.get('content-range','?').split('/')[-1]}")
