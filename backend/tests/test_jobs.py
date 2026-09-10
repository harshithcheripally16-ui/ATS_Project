from app.models import Job, JobCategory, db

def test_recruiter_create_job(client, recruiter_user, auth_header):
    headers = auth_header(recruiter_user)
    cat = JobCategory.query.first()

    payload = {
        'title': 'Senior Backend Engineer',
        'description': 'Develop scalable microservices in Flask and Postgres',
        'category_id': cat.id if cat else None,
        'skills': 'Python, Flask, PostgreSQL',
        'experience': '3-5 years',
        'location': 'San Francisco, CA',
        'salary': '$120,000 - $140,000',
        'deadline': '2026-12-31',
        'status': 'open'
    }

    res = client.post('/api/v1/jobs', json=payload, headers=headers)
    assert res.status_code == 201
    data = res.get_json()['data']
    assert data['job']['title'] == 'Senior Backend Engineer'
    assert data['job']['recruiter_id'] == recruiter_user.id


def test_candidate_cannot_create_job(client, candidate_user, auth_header):
    headers = auth_header(candidate_user)
    payload = {
        'title': 'Candidate Trying to Post Job',
        'description': 'Should fail'
    }
    res = client.post('/api/v1/jobs', json=payload, headers=headers)
    assert res.status_code == 403


def test_job_search_and_filtering(client, recruiter_user, auth_header):
    headers = auth_header(recruiter_user)
    
    # Create 2 jobs
    client.post('/api/v1/jobs', json={
        'title': 'Python Developer',
        'description': 'Build APIs with Python',
        'skills': 'Python, SQL',
        'location': 'Remote',
        'experience': '2 years',
        'status': 'open'
    }, headers=headers)

    client.post('/api/v1/jobs', json={
        'title': 'Frontend React Specialist',
        'description': 'Build UI in JavaScript',
        'skills': 'JavaScript, React, CSS',
        'location': 'New York, NY',
        'experience': '4 years',
        'status': 'open'
    }, headers=headers)

    # Search by skill
    res_skill = client.get('/api/v1/jobs?skill=Python')
    assert res_skill.status_code == 200
    items = res_skill.get_json()['data']['items']
    assert any(item['title'] == 'Python Developer' for item in items)

    # Search by location
    res_loc = client.get('/api/v1/jobs?location=New York')
    assert res_loc.status_code == 200
    items_loc = res_loc.get_json()['data']['items']
    assert any(item['title'] == 'Frontend React Specialist' for item in items_loc)

    # Search by keyword
    res_kw = client.get('/api/v1/jobs?keyword=APIs')
    assert res_kw.status_code == 200
    items_kw = res_kw.get_json()['data']['items']
    assert any(item['title'] == 'Python Developer' for item in items_kw)


def test_job_ownership_and_update(client, recruiter_user, recruiter2_user, auth_header):
    # Recruiter 1 creates job
    res = client.post('/api/v1/jobs', json={
        'title': 'Original Title',
        'description': 'Original description',
        'status': 'open'
    }, headers=auth_header(recruiter_user))
    job_id = res.get_json()['data']['job']['id']

    # Recruiter 2 tries to update Recruiter 1's job -> 403
    res_other = client.put(f'/api/v1/jobs/{job_id}', json={
        'title': 'Hacked Title'
    }, headers=auth_header(recruiter2_user))
    assert res_other.status_code == 403

    # Recruiter 1 updates own job -> 200
    res_owner = client.put(f'/api/v1/jobs/{job_id}', json={
        'title': 'Updated Title'
    }, headers=auth_header(recruiter_user))
    assert res_owner.status_code == 200
    assert res_owner.get_json()['data']['job']['title'] == 'Updated Title'

    # Recruiter 2 tries to delete -> 403
    res_del_other = client.delete(f'/api/v1/jobs/{job_id}', headers=auth_header(recruiter2_user))
    assert res_del_other.status_code == 403

    # Recruiter 1 deletes -> 200
    res_del_owner = client.delete(f'/api/v1/jobs/{job_id}', headers=auth_header(recruiter_user))
    assert res_del_owner.status_code == 200
