from unittest.mock import patch, MagicMock

def test_status_change_notifications(client, candidate_user, recruiter_user, auth_header):
    # Setup job and application
    job_res = client.post('/api/v1/jobs', json={
        'title': 'Full Stack Developer',
        'description': 'Python and React',
        'status': 'open'
    }, headers=auth_header(recruiter_user))
    job_id = job_res.get_json()['data']['job']['id']

    app_res = client.post('/api/v1/applications', json={'job_id': job_id}, headers=auth_header(candidate_user))
    app_id = app_res.get_json()['data']['application']['id']

    # 1. Patch status update email dispatch on the route module
    with patch('app.routes.applications.EmailService.send_status_update_email') as mock_status_email:
        # Move to shortlisted
        res = client.patch(f'/api/v1/applications/{app_id}/status', json={
            'status': 'shortlisted',
            'recruiter_remarks': 'Impressive portfolio'
        }, headers=auth_header(recruiter_user))
        assert res.status_code == 200
        mock_status_email.assert_called_once()
        args, kwargs = mock_status_email.call_args
        assert kwargs['candidate_email'] == candidate_user.email
        assert kwargs['job_title'] == 'Full Stack Developer'
        assert kwargs['new_status'] == 'shortlisted'
        assert kwargs['remarks'] == 'Impressive portfolio'

    # 2. Move from shortlisted to rejected
    with patch('app.routes.applications.EmailService.send_status_update_email') as mock_status_email:
        res = client.patch(f'/api/v1/applications/{app_id}/status', json={
            'status': 'rejected',
            'recruiter_remarks': 'Position filled'
        }, headers=auth_header(recruiter_user))
        assert res.status_code == 200
        mock_status_email.assert_called_once()
        args, kwargs = mock_status_email.call_args
        assert kwargs['new_status'] == 'rejected'


def test_interview_notifications(client, candidate_user, recruiter_user, auth_header):
    # Setup job and shortlisted application
    job_res = client.post('/api/v1/jobs', json={
        'title': 'Backend Specialist',
        'description': 'Flask and PostgreSQL',
        'status': 'open'
    }, headers=auth_header(recruiter_user))
    job_id = job_res.get_json()['data']['job']['id']

    app_res = client.post('/api/v1/applications', json={'job_id': job_id}, headers=auth_header(candidate_user))
    app_id = app_res.get_json()['data']['application']['id']

    client.patch(f'/api/v1/applications/{app_id}/status', json={'status': 'shortlisted'}, headers=auth_header(recruiter_user))

    # 1. Schedule Interview notification
    with patch('app.routes.interviews.EmailService.send_interview_scheduled_email') as mock_int_email:
        sched_res = client.post('/api/v1/interviews', json={
            'application_id': app_id,
            'date': '2026-11-01',
            'time': '11:00 AM',
            'mode': 'online',
            'notes': 'Technical Interview'
        }, headers=auth_header(recruiter_user))
        assert sched_res.status_code == 201
        int_id = sched_res.get_json()['data']['interview']['id']
        mock_int_email.assert_called_once()
        args, kwargs = mock_int_email.call_args
        assert kwargs['candidate_email'] == candidate_user.email
        assert kwargs['date'] == '2026-11-01'
        assert kwargs['is_rescheduled'] is False
        assert kwargs['is_cancelled'] is False

    # 2. Reschedule Interview notification
    with patch('app.routes.interviews.EmailService.send_interview_scheduled_email') as mock_int_email:
        resched_res = client.patch(f'/api/v1/interviews/{int_id}', json={
            'date': '2026-11-05',
            'time': '03:00 PM'
        }, headers=auth_header(recruiter_user))
        assert resched_res.status_code == 200
        mock_int_email.assert_called_once()
        args, kwargs = mock_int_email.call_args
        assert kwargs['date'] == '2026-11-05'
        assert kwargs['is_rescheduled'] is True
        assert kwargs['is_cancelled'] is False

    # 3. Cancel Interview notification
    with patch('app.routes.interviews.EmailService.send_interview_scheduled_email') as mock_int_email:
        cancel_res = client.patch(f'/api/v1/interviews/{int_id}', json={
            'status': 'cancelled'
        }, headers=auth_header(recruiter_user))
        assert cancel_res.status_code == 200
        mock_int_email.assert_called_once()
        args, kwargs = mock_int_email.call_args
        assert kwargs['is_cancelled'] is True


def test_out_of_scope_read_requests_do_not_trigger_emails(client, candidate_user, recruiter_user, auth_header):
    job_res = client.post('/api/v1/jobs', json={
        'title': 'Data Engineer',
        'description': 'Python & SQL',
        'status': 'open'
    }, headers=auth_header(recruiter_user))
    job_id = job_res.get_json()['data']['job']['id']

    with patch('app.routes.applications.EmailService.send_status_update_email') as mock_status_email, \
         patch('app.routes.interviews.EmailService.send_interview_scheduled_email') as mock_int_email:
        
        # Read-only GET queries
        client.get('/api/v1/jobs', headers=auth_header(candidate_user))
        client.get(f'/api/v1/jobs/{job_id}/applications', headers=auth_header(recruiter_user))
        client.get('/api/v1/interviews/me', headers=auth_header(candidate_user))

        mock_status_email.assert_not_called()
        mock_int_email.assert_not_called()


def test_smtp_exception_resilience(client, candidate_user, recruiter_user, auth_header):
    job_res = client.post('/api/v1/jobs', json={
        'title': 'DevOps Engineer',
        'description': 'Docker and Kubernetes',
        'status': 'open'
    }, headers=auth_header(recruiter_user))
    job_id = job_res.get_json()['data']['job']['id']

    app_res = client.post('/api/v1/applications', json={'job_id': job_id}, headers=auth_header(candidate_user))
    app_id = app_res.get_json()['data']['application']['id']

    # Mock EmailService method to raise an exception
    with patch('app.routes.applications.EmailService.send_status_update_email', side_effect=Exception("SMTP Connection Error")):
        # Request should still succeed and update status in database
        res = client.patch(f'/api/v1/applications/{app_id}/status', json={
            'status': 'shortlisted'
        }, headers=auth_header(recruiter_user))
        assert res.status_code == 200
        assert res.get_json()['data']['application']['status'] == 'shortlisted'
