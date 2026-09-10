def test_schedule_interview_workflow(client, candidate_user, recruiter_user, auth_header):
    # Recruiter creates job
    job_res = client.post('/api/v1/jobs', json={
        'title': 'QA Automation Engineer',
        'description': 'Pytest and Selenium testing',
        'status': 'open'
    }, headers=auth_header(recruiter_user))
    job_id = job_res.get_json()['data']['job']['id']

    # Candidate applies
    app_res = client.post('/api/v1/applications', json={'job_id': job_id}, headers=auth_header(candidate_user))
    app_id = app_res.get_json()['data']['application']['id']

    # Attempt to schedule interview while still in 'applied' status -> should fail with state machine error
    bad_sched = client.post('/api/v1/interviews', json={
        'application_id': app_id,
        'date': '2026-10-20',
        'time': '10:00 AM',
        'mode': 'online',
        'notes': 'Google Meet link'
    }, headers=auth_header(recruiter_user))
    assert bad_sched.status_code == 400
    assert 'shortlisted' in bad_sched.get_json()['error'].lower()

    # Recruiter shortlists candidate
    client.patch(f'/api/v1/applications/{app_id}/status', json={'status': 'shortlisted'}, headers=auth_header(recruiter_user))

    # Recruiter now schedules interview
    sched_res = client.post('/api/v1/interviews', json={
        'application_id': app_id,
        'date': '2026-10-20',
        'time': '10:00 AM',
        'mode': 'online',
        'notes': 'https://meet.google.com/abc-defg-hij'
    }, headers=auth_header(recruiter_user))
    assert sched_res.status_code == 201
    int_data = sched_res.get_json()['data']['interview']
    assert int_data['mode'] == 'online'
    int_id = int_data['id']

    # Candidate checks their interviews
    cand_ints = client.get('/api/v1/interviews/me', headers=auth_header(candidate_user))
    assert cand_ints.status_code == 200
    items = cand_ints.get_json()['data']['items']
    assert len(items) == 1
    assert items[0]['id'] == int_id

    # Recruiter reschedules interview
    update_res = client.patch(f'/api/v1/interviews/{int_id}', json={
        'date': '2026-10-22',
        'time': '02:00 PM',
        'status': 'completed'
    }, headers=auth_header(recruiter_user))
    assert update_res.status_code == 200
    assert update_res.get_json()['data']['interview']['status'] == 'completed'
