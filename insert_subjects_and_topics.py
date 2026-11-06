"""
Insert ALL subjects first, then ALL topics
Subjects must exist before topics (foreign key constraint)
"""
import os, requests
from dotenv import load_dotenv
load_dotenv()

u = os.getenv('SUPABASE_URL')
k = os.getenv('SUPABASE_KEY')
h = {
    'apikey': k,
    'Authorization': f'Bearer {k}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=ignore-duplicates'
}

# ── ALL SUBJECTS ──────────────────────────────────────────────────────────────
ALL_SUBJECTS = [
    # School Boards
    {"subject_id":"cbse_maths","subject_name":"CBSE Mathematics","parent_id":"cbse","stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"cbse_science","subject_name":"CBSE Science","parent_id":"cbse","stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"cbse_sst","subject_name":"CBSE Social Science","parent_id":"cbse","stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"cbse_physics_11_12","subject_name":"CBSE Physics 11-12","parent_id":"cbse","stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"cbse_chemistry_11_12","subject_name":"CBSE Chemistry 11-12","parent_id":"cbse","stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"cbse_biology_11_12","subject_name":"CBSE Biology 11-12","parent_id":"cbse","stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"cbse","subject_name":"CBSE Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"icse_board","subject_name":"ICSE Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"tn_state_board","subject_name":"Tamil Nadu State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"mh_state_board","subject_name":"Maharashtra State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"ap_ts_state_board","subject_name":"AP/Telangana State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"karnataka_state_board","subject_name":"Karnataka State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"up_state_board","subject_name":"UP State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"bihar_state_board","subject_name":"Bihar State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"wb_state_board","subject_name":"West Bengal State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"gujarat_state_board","subject_name":"Gujarat State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"punjab_state_board","subject_name":"Punjab State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"rajasthan_state_board","subject_name":"Rajasthan State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"mp_state_board","subject_name":"MP State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"kerala_state_board","subject_name":"Kerala State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"odisha_state_board","subject_name":"Odisha State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"assam_state_board","subject_name":"Assam State Board","parent_id":None,"stream":"school","domain_type":"academic_exam","pillar_id":None},
    # Programming
    {"subject_id":"python_programming","subject_name":"Python Programming","parent_id":"coding","stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"javascript_programming","subject_name":"JavaScript Programming","parent_id":"coding","stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"html_css_web","subject_name":"HTML CSS and Web","parent_id":"coding","stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"c_programming","subject_name":"C Programming","parent_id":"coding","stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"cpp_programming","subject_name":"C++ Programming","parent_id":"coding","stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"java_programming","subject_name":"Java Programming","parent_id":"coding","stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"sql_database","subject_name":"SQL and Databases","parent_id":"coding","stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"dsa_algorithms","subject_name":"Data Structures and Algorithms","parent_id":"coding","stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"coding","subject_name":"Coding and Programming","parent_id":None,"stream":"skill","domain_type":"certification","pillar_id":None},
    # Cybersecurity and Cloud
    {"subject_id":"cybersecurity","subject_name":"Cybersecurity","parent_id":None,"stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"networking","subject_name":"Computer Networking","parent_id":None,"stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"cloud_devops","subject_name":"Cloud and DevOps","parent_id":None,"stream":"skill","domain_type":"certification","pillar_id":None},
    # Data Science and AI
    {"subject_id":"data_science_ml","subject_name":"Data Science and Machine Learning","parent_id":None,"stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"generative_ai","subject_name":"Generative AI and LLMs","parent_id":None,"stream":"skill","domain_type":"certification","pillar_id":None},
    # Finance
    {"subject_id":"ca_cs_cma","subject_name":"CA CS CMA Professional","parent_id":None,"stream":"professional","domain_type":"certification","pillar_id":None},
    {"subject_id":"ca_final","subject_name":"CA Final","parent_id":"ca_cs_cma","stream":"professional","domain_type":"certification","pillar_id":None},
    {"subject_id":"finance_certifications","subject_name":"Finance Certifications","parent_id":None,"stream":"professional","domain_type":"certification","pillar_id":None},
    {"subject_id":"advanced_finance","subject_name":"Advanced Finance CPA IFRS","parent_id":None,"stream":"professional","domain_type":"certification","pillar_id":None},
    # MBA
    {"subject_id":"mba_cat_prep","subject_name":"MBA CAT Preparation","parent_id":None,"stream":"entrance","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"mba_subjects","subject_name":"MBA Subjects","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"personal_finance","subject_name":"Personal Finance","parent_id":None,"stream":"skill","domain_type":"life_skill","pillar_id":None},
    # Competitive Exams
    {"subject_id":"ssc_exams","subject_name":"SSC Exams","parent_id":None,"stream":"govt_job","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"rrb_exams","subject_name":"RRB Railway Exams","parent_id":None,"stream":"govt_job","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"bank_exams","subject_name":"Banking Exams","parent_id":None,"stream":"govt_job","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"defence_exams","subject_name":"Defence Exams","parent_id":None,"stream":"govt_job","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"state_exams","subject_name":"State PSC Exams","parent_id":None,"stream":"govt_job","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"upsc_mains","subject_name":"UPSC Mains","parent_id":None,"stream":"govt_job","domain_type":"academic_exam","pillar_id":None},
    # Indian Languages
    {"subject_id":"tamil_full","subject_name":"Tamil Language Full","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"telugu_full","subject_name":"Telugu Language Full","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"kannada_full","subject_name":"Kannada Language Full","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"malayalam_full","subject_name":"Malayalam Language Full","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"marathi_full","subject_name":"Marathi Language Full","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"bengali_full","subject_name":"Bengali Language Full","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"gujarati_full","subject_name":"Gujarati Language Full","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"punjabi_full","subject_name":"Punjabi Language Full","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"odia_full","subject_name":"Odia Language Full","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"assamese_full","subject_name":"Assamese Language Full","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"sanskrit_full","subject_name":"Sanskrit Language Full","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"urdu_full","subject_name":"Urdu Language Full","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"sindhi_language","subject_name":"Sindhi Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"kashmiri_language","subject_name":"Kashmiri Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"dogri_language","subject_name":"Dogri Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"konkani_language","subject_name":"Konkani Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"bodo_language","subject_name":"Bodo Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"santali_language","subject_name":"Santali Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"maithili_language","subject_name":"Maithili Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"manipuri_language","subject_name":"Manipuri Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"nepali_language","subject_name":"Nepali Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"mizo_language","subject_name":"Mizo Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"khasi_language","subject_name":"Khasi Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"garo_language","subject_name":"Garo Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"tulu_language","subject_name":"Tulu Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"bhili_language","subject_name":"Bhili Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"gondi_language","subject_name":"Gondi Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"kokborok_language","subject_name":"Kokborok Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    # Foreign Languages
    {"subject_id":"french_language","subject_name":"French Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"german_language","subject_name":"German Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"spanish_language","subject_name":"Spanish Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"japanese_language","subject_name":"Japanese Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"mandarin_chinese","subject_name":"Mandarin Chinese","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"korean_language","subject_name":"Korean Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"arabic_language","subject_name":"Arabic Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"portuguese_language","subject_name":"Portuguese Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"italian_language","subject_name":"Italian Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"russian_language","subject_name":"Russian Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"dutch_language","subject_name":"Dutch Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"swedish_language","subject_name":"Swedish Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"norwegian_language","subject_name":"Norwegian Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    {"subject_id":"danish_language","subject_name":"Danish Language","parent_id":None,"stream":"language","domain_type":"language","pillar_id":None},
    # Study Abroad
    {"subject_id":"study_abroad_usa","subject_name":"Study in USA","parent_id":None,"stream":"abroad","domain_type":"international","pillar_id":None},
    {"subject_id":"study_abroad_uk","subject_name":"Study in UK","parent_id":None,"stream":"abroad","domain_type":"international","pillar_id":None},
    {"subject_id":"study_abroad_canada","subject_name":"Study in Canada","parent_id":None,"stream":"abroad","domain_type":"international","pillar_id":None},
    {"subject_id":"study_abroad_australia","subject_name":"Study in Australia","parent_id":None,"stream":"abroad","domain_type":"international","pillar_id":None},
    {"subject_id":"study_abroad_germany","subject_name":"Study in Germany","parent_id":None,"stream":"abroad","domain_type":"international","pillar_id":None},
    {"subject_id":"study_abroad_other","subject_name":"Study Abroad Other Countries","parent_id":None,"stream":"abroad","domain_type":"international","pillar_id":None},
    {"subject_id":"return_india","subject_name":"Returning to India","parent_id":None,"stream":"abroad","domain_type":"international","pillar_id":None},
    {"subject_id":"international_exams","subject_name":"International Exams","parent_id":None,"stream":"abroad","domain_type":"international","pillar_id":None},
    # Medical
    {"subject_id":"medical_pg","subject_name":"Medical PG Exams","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"usmle_prep","subject_name":"USMLE Preparation","parent_id":None,"stream":"professional","domain_type":"international","pillar_id":None},
    {"subject_id":"international_medical","subject_name":"International Medical Exams","parent_id":None,"stream":"professional","domain_type":"international","pillar_id":None},
    {"subject_id":"nursing","subject_name":"Nursing Exams","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"pharmacy","subject_name":"Pharmacy Exams","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    # Engineering
    {"subject_id":"gate_prep","subject_name":"GATE Preparation","parent_id":None,"stream":"entrance","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"ese_ies","subject_name":"ESE IES Preparation","parent_id":None,"stream":"entrance","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"civil_engineering","subject_name":"Civil Engineering","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"mechanical_engineering","subject_name":"Mechanical Engineering","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"electrical_engineering","subject_name":"Electrical Engineering","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"electronics_engineering","subject_name":"Electronics Engineering","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    # Other Professional
    {"subject_id":"architecture","subject_name":"Architecture and Design","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"hospitality_tourism","subject_name":"Hospitality and Tourism","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"fashion_design","subject_name":"Fashion and Design","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"media_journalism","subject_name":"Media and Journalism","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"sports_education","subject_name":"Sports and Physical Education","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"agriculture_exams","subject_name":"Agriculture Exams","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"law_entrance","subject_name":"Law Entrance Exams","parent_id":None,"stream":"entrance","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"law_practice","subject_name":"Law Practice and Bar Exams","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"research_academia","subject_name":"Research and Academia","parent_id":None,"stream":"professional","domain_type":"academic_exam","pillar_id":None},
    {"subject_id":"entrepreneurship","subject_name":"Entrepreneurship and Startup","parent_id":None,"stream":"skill","domain_type":"life_skill","pillar_id":None},
    {"subject_id":"current_affairs_full","subject_name":"Current Affairs Complete","parent_id":None,"stream":"general","domain_type":"academic_exam","pillar_id":None},
    # Skills
    {"subject_id":"emerging_tech","subject_name":"Emerging Technologies","parent_id":None,"stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"digital_marketing","subject_name":"Digital Marketing","parent_id":None,"stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"uiux_design","subject_name":"UI UX Design","parent_id":None,"stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"creative_skills","subject_name":"Creative Skills","parent_id":None,"stream":"skill","domain_type":"certification","pillar_id":None},
    {"subject_id":"soft_skills","subject_name":"Soft Skills","parent_id":None,"stream":"skill","domain_type":"life_skill","pillar_id":None},
    {"subject_id":"iti_vocational","subject_name":"ITI Vocational Trades","parent_id":None,"stream":"vocational","domain_type":"certification","pillar_id":None},
]

print(f"Total subjects to insert: {len(ALL_SUBJECTS)}")

# Insert subjects first
inserted_s = skipped_s = errors_s = 0
BATCH = 50
for i in range(0, len(ALL_SUBJECTS), BATCH):
    batch = ALL_SUBJECTS[i:i+BATCH]
    r = requests.post(f'{u}/rest/v1/subjects', headers=h, json=batch, timeout=30)
    if r.status_code in [200, 201]:
        inserted_s += len(batch)
        print(f'Subjects batch {i//BATCH+1}: +{len(batch)} inserted')
    elif r.status_code == 409:
        skipped_s += len(batch)
        print(f'Subjects batch {i//BATCH+1}: {len(batch)} already exist')
    else:
        errors_s += len(batch)
        print(f'Subjects batch {i//BATCH+1}: ERROR {r.status_code}: {r.text[:150]}')

print(f'\nSubjects: {inserted_s} inserted | {skipped_s} skipped | {errors_s} errors')

# Now test one topic insert
print('\nTesting topic insert...')
test = [{
    'topic_id': 'test_python_basics_xyz123',
    'subject_id': 'python_programming',
    'topic_name': 'Python Basics Test',
    'difficulty_range': '2-5',
    'is_visual': False,
    'coverage_score': 90,
    'question_target': 5000,
    'questions_available': 0,
    'display_order': 1,
    'launch_phase': 'phase_1_now'
}]
r2 = requests.post(f'{u}/rest/v1/topics', headers=h, json=test, timeout=15)
print(f'Topic test: {r2.status_code} - {r2.text[:100]}')
if r2.status_code in [200,201]:
    # Clean up test topic
    requests.delete(f'{u}/rest/v1/topics?topic_id=eq.test_python_basics_xyz123', headers=h)
    print('Topic insert works! Now run insert_all_topics.py and insert_all_topics_complete.py')
