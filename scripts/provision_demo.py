"""Provision the explicitly requested isolated demonstration institution.
Requires the dedicated Campus project's admin keys file, never browser credentials.
Run only when initially provisioning/resetting the demonstration institution.
"""
import datetime as dt
import json
import os
import secrets
import urllib.error
import urllib.request
from pathlib import Path

BASE='https://pftbpimhyophitfuzcxn.supabase.co'
values=dict(line.split('=',1) for line in Path('.env.local').read_text().splitlines() if '=' in line and not line.startswith('#'))
assert values['NEXT_PUBLIC_SUPABASE_URL']==BASE
keys=json.loads(Path(os.environ['CAMPUS_TEST_ADMIN_KEYS_FILE']).read_text())
ADMIN=next(k['api_key'] for k in keys if k['id']=='service_role')
PUBLIC=values['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
def call(path,method='GET',data=None,token=None,raw=False,mime='application/json'):
 body=data if raw else json.dumps(data).encode() if data is not None else None
 req=urllib.request.Request(BASE+path,data=body,method=method,headers={'apikey':PUBLIC if token else ADMIN,'Authorization':'Bearer '+(token or ADMIN),'Content-Type':mime,'Prefer':'return=representation'})
 try:
  with urllib.request.urlopen(req,timeout=30) as r:
   b=r.read();return json.loads(b) if b and 'json' in r.headers.get('Content-Type','') else b
 except urllib.error.HTTPError as e:
  raise RuntimeError(f'{method} {path}: {e.code} {e.read().decode()}') from None
def insert(table,row,token=None):return call('/rest/v1/'+table,'POST',row,token)[0]
def rpc(name,args,token):return call('/rest/v1/rpc/'+name,'POST',args,token)
users=call('/auth/v1/admin/users?per_page=100')['users']
def account(email,password=None):
 existing=next((u for u in users if u['email']==email),None)
 if existing:
  if password:call('/auth/v1/admin/users/'+existing['id'],'PUT',{'password':password,'email_confirm':True})
  return existing
 user=call('/auth/v1/admin/users','POST',{'email':email,'password':password or secrets.token_urlsafe(32)+'Aa1!','email_confirm':True});users.append(user);return user

demo_rows=call('/rest/v1/institutions?slug=eq.syrka-demonstration')
assert not demo_rows, 'Demonstration institution already exists. Use the existing demo configuration; do not silently overwrite it.'
tenant=insert('institutions',{'name':'Syrka Demonstration Campus','slug':'syrka-demonstration'})['id']
settings={'CAMPUS_DEMO_INSTITUTION_ID':tenant}
demo={}
for role in ['student','faculty','admin']:
 email=f'demo-{role}@syrka-campus.example.invalid';password=secrets.token_urlsafe(32)+'Aa1!';user=account(email,password)
 insert('memberships',{'institution_id':tenant,'user_id':user['id'],'role':role})
 session=call('/auth/v1/token?grant_type=password','POST',{'email':email,'password':password})
 demo[role]={**user,'token':session['access_token']}
 settings[f'CAMPUS_DEMO_{role.upper()}_EMAIL']=email;settings[f'CAMPUS_DEMO_{role.upper()}_PASSWORD']=password
# Save server-only settings immediately, so partial provisioning can be repaired safely.
with Path('.env.local').open('a') as f:
 for key,value in settings.items():f.write(f'{key}={value}\n')
Path('.env.local').chmod(0o600)
Path('/workspace/scratch/campus-demo-settings.json').write_text(json.dumps(settings));Path('/workspace/scratch/campus-demo-settings.json').chmod(0o600)
admin=demo['admin']['token'];faculty=demo['faculty']['token'];student=demo['student']['token']
now=dt.datetime.now(dt.timezone.utc);stamp=lambda d:d.isoformat()
dept=insert('departments',{'institution_id':tenant,'name':'Humanities & Society','code':'HUM'},admin)['id']
term=insert('academic_terms',{'institution_id':tenant,'name':'Autumn 2026','starts_on':'2026-09-01','ends_on':'2027-01-31'},admin)['id']
insert('programs',{'institution_id':tenant,'department_id':dept,'name':'European Studies'},admin)
insert('registration_windows',{'institution_id':tenant,'term_id':term,'opens_at':stamp(now-dt.timedelta(days=7)),'closes_at':stamp(now+dt.timedelta(days=60)),'withdrawal_closes_at':stamp(now+dt.timedelta(days=90))},admin)

def pdf(title,lines):
 def escape(s):return s.replace('\\','\\\\').replace('(','\\(').replace(')','\\)')
 stream=('BT /F1 20 Tf 55 770 Td ('+escape(title)+') Tj /F1 11 Tf '+''.join('0 -28 Td ('+escape(line)+') Tj ' for line in lines)+'ET').encode()
 objects=[b'<< /Type /Catalog /Pages 2 0 R >>',b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',b'<< /Length '+str(len(stream)).encode()+b' >>\nstream\n'+stream+b'\nendstream']
 out=b'%PDF-1.4\n';offsets=[]
 for i,obj in enumerate(objects,1):offsets.append(len(out));out+=f'{i} 0 obj\n'.encode()+obj+b'\nendobj\n'
 start=len(out);out+=b'xref\n0 6\n0000000000 65535 f \n'+b''.join(f'{o:010d} 00000 n \n'.encode() for o in offsets)+f'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{start}\n%%EOF\n'.encode();return out

first=None
for i,(code,title,credits,description) in enumerate([
 ('HUM101','Ways of knowing',6,'Explore how evidence, experience and interpretation shape our understanding of the world.'),
 ('DES204','Design, systems & society',5,'Study the relationships between thoughtful design, public systems and everyday life.'),
 ('DAT110','Reading the world through data',6,'Learn to question, interpret and communicate data in its social context.')]):
 course=insert('courses',{'institution_id':tenant,'department_id':dept,'code':code,'title':title,'description':description,'credits':credits},admin)['id']
 offering=insert('offerings',{'institution_id':tenant,'course_id':course,'term_id':term,'section':'A','capacity':30,'waitlist_enabled':True,'published':True,'syllabus':'Demonstration course. Read, discuss and reflect. Weekly seminars combine close reading, practical inquiry and independent study.'},admin)['id']
 if first is None:first=offering
 insert('faculty_assignments',{'institution_id':tenant,'offering_id':offering,'user_id':demo['faculty']['id']},admin)
 if i<2:rpc('register_course',{'tenant':tenant,'offering':offering},student)
 for week,name,desc in [(1,'Finding our bearings','Begin with the syllabus. What counts as a good question?'),(2,'Evidence & interpretation','Compare perspectives and discuss the assumptions behind an argument.'),(3,'Ideas in practice','Apply your reading to a situation from everyday life.')]:
  insert('modules',{'institution_id':tenant,'offering_id':offering,'title':f'Week {week:02} / {name}','description':desc,'position':week,'published':True},faculty)
 path=f'{tenant}/{offering}/demonstration-syllabus.pdf';document=pdf(title,['SYRKA CAMPUS - DEMONSTRATION DOCUMENT','Autumn 2026 | '+code+' | '+str(credits)+' ECTS','Learning outcomes: ask careful questions and assess evidence.','Week 1: Finding our bearings','Week 2: Evidence and interpretation','Week 3: Ideas in practice','Assessment: reflective writing and a reading checkpoint.','This document contains sample academic content only.'])
 call('/storage/v1/object/campus-materials/'+path,'POST',document,faculty,True,'application/pdf')
 insert('materials',{'institution_id':tenant,'offering_id':offering,'title':'Course syllabus / PDF','object_path':path,'published':True},faculty)
 insert('materials',{'institution_id':tenant,'offering_id':offering,'title':'Optional reading / OpenStax resources','external_url':'https://openstax.org/subjects','published':True},faculty)
 insert('announcements',{'institution_id':tenant,'offering_id':offering,'title':'Welcome to the course','body':'Start with the syllabus, then explore the weekly learning path. This is a shared demonstration course with sample records.','published':True},faculty)
 insert('assignments',{'institution_id':tenant,'offering_id':offering,'title':'Reflection / A question worth asking','instructions':'Choose an idea from the reading. In 300 words, explain what it helps you see and identify one question you would take into the seminar. This is a demonstration assignment.','due_at':stamp(now+dt.timedelta(days=4+i)),'max_points':100,'max_submissions':3,'published':True},faculty)
 insert('calendar_events',{'institution_id':tenant,'offering_id':offering,'title':title+' / seminar','starts_at':stamp(now+dt.timedelta(days=2+i)),'ends_at':stamp(now+dt.timedelta(days=2+i,hours=1))},faculty)
 if i<2:insert('attendance',{'institution_id':tenant,'offering_id':offering,'user_id':demo['student']['id'],'session_date':now.date().isoformat(),'status':'present'},faculty)
 if i==0:
  completed=insert('assignments',{'institution_id':tenant,'offering_id':offering,'title':'First reflection / Published example','instructions':'An example of a completed and marked reflection.','due_at':stamp(now+dt.timedelta(days=1)),'max_points':100,'published':True},faculty)['id']
  sub=rpc('submit_assignment',{'tenant':tenant,'assignment':completed,'body_text':'The strongest questions make their assumptions visible. Comparing different accounts of the same event helps us distinguish evidence from interpretation.','finalize':True},student)
  rpc('grade_submission',{'tenant':tenant,'submission':sub,'score':84,'comments':'A thoughtful reflection. Develop the comparison with a specific example next time.','publish':True},faculty)
  cat=insert('grade_categories',{'institution_id':tenant,'offering_id':offering,'name':'Completed coursework','weight':1},faculty)['id']
  insert('grade_items',{'institution_id':tenant,'category_id':cat,'assignment_id':completed,'title':'First reflection'},faculty)
  rpc('calculate_course_grade',{'tenant':tenant,'offering':offering,'student':demo['student']['id'],'comments':'Example published course result','publish':True},faculty)
  exam=insert('assessments',{'institution_id':tenant,'offering_id':offering,'title':'Reading checkpoint','kind':'quiz','opens_at':stamp(now-dt.timedelta(hours=1)),'closes_at':stamp(now+dt.timedelta(days=30)),'time_limit_minutes':20,'attempt_limit':10,'randomized':True,'published':True,'results_published':True},faculty)['id']
  for content in [{'kind':'single','prompt':'Which response best supports an academic argument?','points':5,'options':[{'body':'A clearly explained claim supported by evidence','correct':True},{'body':'An unsupported assertion','correct':False}]},{'kind':'multiple','prompt':'Select the qualities of a useful research question.','points':5,'options':[{'body':'Clear scope','correct':True},{'body':'Open to evidence','correct':True},{'body':'Assumes its conclusion','correct':False}]},{'kind':'boolean','prompt':'Evidence and interpretation are always the same thing.','points':5,'options':[{'body':'True','correct':False},{'body':'False','correct':True}]},{'kind':'short','prompt':'What platform are you exploring?','points':5,'expected':'Syrka'},{'kind':'essay','prompt':'Describe one question you would bring to the seminar.','points':10}]:rpc('author_question',{'tenant':tenant,'assessment':exam,'content':content},faculty)
# Separate real institution and explicitly approved owner identity.
owner_email=os.environ['CAMPUS_OWNER_EMAIL'];owner=account(owner_email)
real=call('/rest/v1/institutions?slug=eq.praxis-institute')
praxis=real[0] if real else insert('institutions',{'name':'Praxis Institute','slug':'praxis-institute'})
existing=call(f"/rest/v1/memberships?institution_id=eq.{praxis['id']}&user_id=eq.{owner['id']}")
if not existing:insert('memberships',{'institution_id':praxis['id'],'user_id':owner['id'],'role':'admin'})
link=call('/auth/v1/admin/generate_link','POST',{'type':'recovery','email':owner_email})
owner_settings={'institution_id':praxis['id'],'user_id':owner['id'],'email':owner_email,'setup_link':'https://www.syrka.co/cam/auth/confirm?type=recovery&token_hash='+link['hashed_token']}
Path('/workspace/scratch/campus-owner-setup.json').write_text(json.dumps(owner_settings));Path('/workspace/scratch/campus-owner-setup.json').chmod(0o600)
print('Provisioned isolated demonstration campus, three demo roles, sample academic workflows, and Praxis Institute administrator. No credentials printed.')
