import io
from app.models import Job, Application, db

def test_candidate_profile_update(client, candidate_user, auth_header):
    headers = auth_header(candidate_user)

    res = client.put('/api/v1/candidates/me', json={
        'name': 'Candidate Updated Name',
        'phone': '+1999888777',
        'skills': 'Python, Flask, Docker, Kubernetes',
        'experience': '5 years Senior Backend Developer',
        'education': 'M.S. Computer Science'
    }, headers=headers)
    assert res.status_code == 200
    data = res.get_json()['data']['profile']
    assert data['skills'] == ['Python', 'Flask', 'Docker', 'Kubernetes']
    assert data['experience'] == '5 years Senior Backend Developer'
    assert data['name'] == 'Candidate Updated Name'


def test_candidate_resume_upload(client, candidate_user, auth_header):
    headers = {'Authorization': auth_header(candidate_user)['Authorization']}
    
    # Valid PDF upload
    pdf_data = (io.BytesIO(b"%PDF-1.4 dummy resume content"), "my_resume.pdf")
    res = client.post('/api/v1/candidates/me/resume', data={'resume': pdf_data}, content_type='multipart/form-data', headers=headers)
    assert res.status_code == 200
    data = res.get_json()['data']
    assert 'resume_url' in data
    assert data['resume_url'].endswith('.pdf')

    # Invalid extension (e.g. .exe)
    bad_data = (io.BytesIO(b"malicious executable"), "malicious.exe")
    bad_res = client.post('/api/v1/candidates/me/resume', data={'resume': bad_data}, content_type='multipart/form-data', headers=headers)
    assert bad_res.status_code == 400
    assert 'Unsupported file extension' in bad_res.get_json()['error']


def test_candidate_apply_and_duplicate_prevention(client, candidate_user, recruiter_user, auth_header):
    # Recruiter creates job
    job_res = client.post('/api/v1/jobs', json={
        'title': 'Full Stack Engineer',
        'description': 'Building next gen web applications',
        'status': 'open'
    }, headers=auth_header(recruiter_user))
    job_id = job_res.get_json()['data']['job']['id']

    # Candidate applies
    apply_res = client.post('/api/v1/applications', json={'job_id': job_id}, headers=auth_header(candidate_user))
    assert apply_res.status_code == 201
    app_data = apply_res.get_json()['data']['application']
    assert app_data['status'] == 'applied'

    # Candidate attempts duplicate apply
    dup_res = client.post('/api/v1/applications', json={'job_id': job_id}, headers=auth_header(candidate_user))
    assert dup_res.status_code == 400
    assert 'already applied' in dup_res.get_json()['error'].lower()

    # Candidate lists own applications
    my_apps = client.get('/api/v1/applications/me', headers=auth_header(candidate_user))
    assert my_apps.status_code == 200
    items = my_apps.get_json()['data']['items']
    assert len(items) == 1
    assert items[0]['job_id'] == job_id


def test_candidate_apply_with_resume_file(client, candidate_user, recruiter_user, auth_header):
    # Recruiter creates job
    job_res = client.post('/api/v1/jobs', json={
        'title': 'AI Systems Engineer',
        'description': 'Deploy neural network inference engines',
        'status': 'open'
    }, headers=auth_header(recruiter_user))
    job_id = job_res.get_json()['data']['job']['id']

    # Candidate applies with resume upload via multipart form
    pdf_resume = (io.BytesIO(b"%PDF-1.4 AI Engineer Resume Content"), "ai_candidate_resume.pdf")
    apply_res = client.post(
        '/api/v1/applications',
        data={'job_id': job_id, 'resume': pdf_resume},
        content_type='multipart/form-data',
        headers=auth_header(candidate_user)
    )
    assert apply_res.status_code == 201
    app_data = apply_res.get_json()['data']['application']
    assert app_data['status'] == 'applied'
    assert app_data['candidate']['resume_url'] is not None
    assert app_data['candidate']['resume_url'].endswith('.pdf')


def test_recruiter_jobs_cross_visibility(client, recruiter_user, recruiter2_user, auth_header):
    # Recruiter 1 creates Job A
    job_a = client.post('/api/v1/jobs', json={
        'title': 'Job from Recruiter 1',
        'description': 'Description A',
        'status': 'open'
    }, headers=auth_header(recruiter_user)).get_json()['data']['job']

    # Recruiter 2 creates Job B
    job_b = client.post('/api/v1/jobs', json={
        'title': 'Job from Recruiter 2',
        'description': 'Description B',
        'status': 'open'
    }, headers=auth_header(recruiter2_user)).get_json()['data']['job']

    # Recruiter 1 requests my-jobs with default (all)
    all_res = client.get('/api/v1/jobs/my-jobs', headers=auth_header(recruiter_user))
    assert all_res.status_code == 200
    all_titles = [j['title'] for j in all_res.get_json()['data']['items']]
    assert 'Job from Recruiter 1' in all_titles
    assert 'Job from Recruiter 2' in all_titles

    # Recruiter 1 requests my-jobs with scope=mine
    mine_res = client.get('/api/v1/jobs/my-jobs?scope=mine', headers=auth_header(recruiter_user))
    assert mine_res.status_code == 200
    mine_titles = [j['title'] for j in mine_res.get_json()['data']['items']]
    assert 'Job from Recruiter 1' in mine_titles
    assert 'Job from Recruiter 2' not in mine_titles

