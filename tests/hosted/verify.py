"""Explicitly run hosted verification; credentials/fixtures are never committed.
CAMPUS_TEST_ADMIN_KEYS_FILE points to Supabase CLI api-keys JSON.
Only the owner's dedicated Campus project is accepted by this harness.
"""
import concurrent.futures
import datetime as dt
import json
import os
import secrets
import urllib.error
import urllib.request
import uuid
from pathlib import Path

REF = 'pftbpimhyophitfuzcxn'
BASE = f'https://{REF}.supabase.co'
values = dict(line.split('=', 1) for line in Path('.env.local').read_text().splitlines() if '=' in line)
assert values['NEXT_PUBLIC_SUPABASE_URL'] == BASE, 'Refusing an unexpected backend'
PUBLIC = values['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
keys = json.loads(Path(os.environ['CAMPUS_TEST_ADMIN_KEYS_FILE']).read_text())
ADMIN = next(k['api_key'] for k in keys if k['id'] == 'service_role')
RUN = uuid.uuid4().hex[:12]
fixture = {'run': RUN, 'users': {}, 'institutions': [], 'objects': []}

def call(path, method='GET', data=None, token=None, privileged=False, raw=False, expected=None, content_type=None):
    body = data if raw else json.dumps(data).encode() if data is not None else None
    headers = {'apikey': ADMIN if privileged else PUBLIC, 'Authorization': 'Bearer ' + (ADMIN if privileged else token or PUBLIC), 'Content-Type': content_type or 'application/json', 'Prefer': 'return=representation'}
    req = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            body = response.read()
            result = json.loads(body) if body and 'json' in response.headers.get('Content-Type', '') else body
            status = response.status
    except urllib.error.HTTPError as e:
        status = e.code
        result = json.loads(e.read())
    if expected is not None:
        assert status in expected, f'{method} {path}: unexpected status {status}'
    else:
        assert status < 300, f'{method} {path}: {status} {result}'
    return result

def insert(table, row, token=None, privileged=False):
    return call('/rest/v1/' + table, 'POST', row, token, privileged)[0]

def patch(table, ident, row, token):
    return call(f'/rest/v1/{table}?id=eq.{ident}', 'PATCH', row, token)

def rpc(name, row, token):
    return call('/rest/v1/rpc/' + name, 'POST', row, token)

def check(label):
    print('PASS', label, flush=True)

try:
    for role in ['admin', 'faculty', 'student', 'second', 'foreign_admin']:
        email = f'campus-verification-{RUN}-{role}@example.invalid'
        password = secrets.token_urlsafe(24) + 'aA1!'
        user = call('/auth/v1/admin/users', 'POST', {'email': email, 'password': password, 'email_confirm': True}, privileged=True)
        fixture['users'][role] = {'id': user['id'], 'email': email, 'password': password}
        session = call('/auth/v1/token?grant_type=password', 'POST', {'email': email, 'password': password})
        fixture['users'][role] = {'id': user['id'], 'email': email, 'password': password, 'token': session['access_token']}
    for suffix in ['a', 'b']:
        tenant = insert('institutions', {'name': f'Verification institution {suffix.upper()} ({RUN})', 'slug': f'verification-{RUN}-{suffix}'}, privileged=True)['id']
        fixture['institutions'].append(tenant)
    tenant, foreign = fixture['institutions']
    for role, user in fixture['users'].items():
        insert('memberships', {'institution_id': foreign if role == 'foreign_admin' else tenant, 'user_id': user['id'], 'role': 'admin' if role in ['admin', 'foreign_admin'] else 'student' if role in ['student', 'second'] else 'faculty'}, privileged=True)
    admin = fixture['users']['admin']['token']
    faculty = fixture['users']['faculty']['token']
    outsider = fixture['users']['foreign_admin']['token']
    dept = insert('departments', {'institution_id': tenant, 'code': 'HUM', 'name': 'Humanities'}, admin)['id']
    term = insert('academic_terms', {'institution_id': tenant, 'name': 'Verification term', 'starts_on': '2026-10-01', 'ends_on': '2027-01-31'}, admin)['id']
    course = insert('courses', {'institution_id': tenant, 'department_id': dept, 'code': 'HUM101', 'title': 'Ways of knowing', 'description': 'Hosted workflow verification', 'credits': 6}, admin)['id']
    offering = insert('offerings', {'institution_id': tenant, 'course_id': course, 'term_id': term, 'capacity': 1, 'waitlist_enabled': True, 'published': True}, admin)['id']
    fixture['offering'] = offering
    insert('faculty_assignments', {'institution_id': tenant, 'offering_id': offering, 'user_id': fixture['users']['faculty']['id']}, admin)
    now = dt.datetime.now(dt.timezone.utc)
    stamp = lambda value: value.isoformat()
    insert('registration_windows', {'institution_id': tenant, 'term_id': term, 'opens_at': stamp(now-dt.timedelta(days=1)), 'closes_at': stamp(now+dt.timedelta(days=1)), 'withdrawal_closes_at': stamp(now+dt.timedelta(days=2))}, admin)
    assert call(f'/rest/v1/courses?institution_id=eq.{tenant}', token=outsider) == []
    call('/rest/v1/departments', 'POST', {'institution_id': tenant, 'code': 'BAD', 'name': 'Intrusion'}, outsider, expected=[403])
    check('Admin structure, faculty assignment and two-institution isolation')
    students = [fixture['users'][r] for r in ['student', 'second']]
    def register(user):
        return rpc('register_course', {'tenant': tenant, 'offering': offering}, user['token'])
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(register, students))
    assert sorted(results) == ['enrolled', 'waitlisted']
    student = students[results.index('enrolled')]
    fixture['enrolled_student'] = student
    check('Hosted concurrent last-seat registration and waitlist')
    path = f'{tenant}/{offering}/{uuid.uuid4()}.pdf'
    fixture['objects'].append(path)
    pdf = b'%PDF-1.4\n% Campus verification document\n%%EOF\n'
    call('/storage/v1/object/campus-materials/' + path, 'POST', pdf, faculty, raw=True, content_type='application/pdf')
    material = insert('materials', {'institution_id': tenant, 'offering_id': offering, 'title': 'Verification syllabus', 'object_path': path, 'published': False}, faculty)['id']
    call('/storage/v1/object/sign/campus-materials/' + path, 'POST', {'expiresIn': 60}, student['token'], expected=[400, 403, 404])
    patch('materials', material, {'published': True}, faculty)
    signed = call('/storage/v1/object/sign/campus-materials/' + path, 'POST', {'expiresIn': 60}, student['token'])
    url = signed.get('signedURL', signed.get('signedUrl'))
    assert url
    with urllib.request.urlopen(BASE + '/storage/v1' + url if url.startswith('/object/') else BASE + url) as response:
        assert response.read() == pdf
    call('/storage/v1/object/sign/campus-materials/' + path, 'POST', {'expiresIn': 60}, outsider, expected=[400, 403, 404])
    check('Real private Storage upload, publication gate and signed download')
    assignment = insert('assignments', {'institution_id': tenant, 'offering_id': offering, 'title': 'Reflection', 'instructions': 'Discuss the reading', 'due_at': stamp(now+dt.timedelta(days=1)), 'max_points': 100, 'published': True}, faculty)['id']
    fixture['assignment'] = assignment
    rpc('submit_assignment', {'tenant': tenant, 'assignment': assignment, 'body_text': 'Draft', 'finalize': False}, student['token'])
    submission = rpc('submit_assignment', {'tenant': tenant, 'assignment': assignment, 'body_text': 'A considered response to the reading.', 'finalize': True}, student['token'])
    rpc('grade_submission', {'tenant': tenant, 'submission': submission, 'score': 86, 'comments': 'Well argued', 'publish': False}, faculty)
    assert call('/rest/v1/grades', token=student['token']) == []
    assert call('/rest/v1/submissions', token=outsider) == []
    rpc('grade_submission', {'tenant': tenant, 'submission': submission, 'score': 86, 'comments': 'Well argued', 'publish': True}, faculty)
    assert float(call('/rest/v1/grades', token=student['token'])[0]['points']) == 86
    assert call('/rest/v1/grades', token=outsider) == []
    assert len(call('/rest/v1/grades', token=admin)) == 1
    check('Hosted assignment draft/final submission, private grading and publication')
    assessment = insert('assessments', {'institution_id': tenant, 'offering_id': offering, 'title': 'Reading quiz', 'kind': 'quiz', 'opens_at': stamp(now-dt.timedelta(hours=1)), 'closes_at': stamp(now+dt.timedelta(hours=1)), 'published': True, 'time_limit_minutes': 30}, faculty)['id']
    question = rpc('author_question', {'tenant': tenant, 'assessment': assessment, 'content': {'kind': 'short', 'prompt': 'Name the platform', 'points': 10, 'expected': 'Syrka'}}, faculty)
    attempt = rpc('start_assessment', {'tenant': tenant, 'assessment': assessment}, student['token'])
    rpc('save_attempt', {'tenant': tenant, 'attempt': attempt, 'answers': {question: 'Syrka'}, 'finalize': True}, student['token'])
    assert rpc('read_attempt', {'tenant': tenant, 'attempt': attempt}, student['token'])['questions'][0]['points'] is None
    assert call('/rest/v1/answer_keys', token=student['token']) == []
    patch('assessments', assessment, {'results_published': True}, faculty)
    assert rpc('read_attempt', {'tenant': tenant, 'attempt': attempt}, student['token'])['questions'][0]['points'] == 10
    check('Hosted assessment marking and answer/result confidentiality')
    category = insert('grade_categories', {'institution_id': tenant, 'offering_id': offering, 'name': 'Coursework', 'weight': 1}, faculty)['id']
    insert('grade_items', {'institution_id': tenant, 'category_id': category, 'assignment_id': assignment, 'title': 'Reflection'}, faculty)
    assert float(rpc('calculate_course_grade', {'tenant': tenant, 'offering': offering, 'student': student['id'], 'comments': 'Verified result', 'publish': True}, faculty)) == 86
    insert('attendance', {'institution_id': tenant, 'offering_id': offering, 'user_id': student['id'], 'session_date': now.date().isoformat(), 'status': 'present'}, faculty)
    insert('calendar_events', {'institution_id': tenant, 'offering_id': offering, 'title': 'Seminar', 'starts_at': stamp(now), 'ends_at': stamp(now+dt.timedelta(hours=1))}, faculty)
    assert len(call('/rest/v1/course_grades', token=student['token'])) == 1
    assert call('/rest/v1/course_grades', token=outsider) == []
    assert call('/rest/v1/attendance', token=outsider) == []
    call('/auth/v1/user', 'PUT', {'data': {'role': 'admin', 'institution_id': tenant}}, student['token'])
    call('/rest/v1/departments', 'POST', {'institution_id': tenant, 'code': 'ESC', 'name': 'Escalation'}, student['token'], expected=[403])
    check('Hosted final grades, attendance, calendar and metadata escalation denial')
    fixture['verified'] = True
finally:
    fixture_path = Path(os.environ.get('CAMPUS_TEST_FIXTURE_PATH', '/workspace/scratch/campus-hosted-fixture.json'))
    fixture_path.write_text(json.dumps(fixture))
    fixture_path.chmod(0o600)
