from app.services import ApplicationStateMachine

def test_state_machine_matrix():
    # Valid transitions
    assert ApplicationStateMachine.can_transition('applied', 'shortlisted')[0] is True
    assert ApplicationStateMachine.can_transition('applied', 'rejected')[0] is True
    assert ApplicationStateMachine.can_transition('shortlisted', 'interview_scheduled')[0] is True
    assert ApplicationStateMachine.can_transition('shortlisted', 'rejected')[0] is True
    assert ApplicationStateMachine.can_transition('interview_scheduled', 'selected')[0] is True
    assert ApplicationStateMachine.can_transition('interview_scheduled', 'rejected')[0] is True

    # Invalid transitions
    assert ApplicationStateMachine.can_transition('applied', 'selected')[0] is False
    assert ApplicationStateMachine.can_transition('applied', 'interview_scheduled')[0] is False
    assert ApplicationStateMachine.can_transition('shortlisted', 'selected')[0] is False
    assert ApplicationStateMachine.can_transition('rejected', 'shortlisted')[0] is False
    assert ApplicationStateMachine.can_transition('selected', 'rejected')[0] is False
    assert ApplicationStateMachine.can_transition('selected', 'applied')[0] is False


def test_api_state_machine_enforcement(client, candidate_user, recruiter_user, recruiter2_user, auth_header):
    # Recruiter creates job
    job_res = client.post('/api/v1/jobs', json={
        'title': 'DevOps Engineer',
        'description': 'Manage Kubernetes clusters',
        'status': 'open'
    }, headers=auth_header(recruiter_user))
    job_id = job_res.get_json()['data']['job']['id']

    # Candidate applies
    app_res = client.post('/api/v1/applications', json={'job_id': job_id}, headers=auth_header(candidate_user))
    app_id = app_res.get_json()['data']['application']['id']

    # Attempt invalid jump: applied -> selected (should be 400)
    invalid_jump = client.patch(f'/api/v1/applications/{app_id}/status', json={
        'status': 'selected'
    }, headers=auth_header(recruiter_user))
    assert invalid_jump.status_code == 400
    assert 'State transition rejected' in invalid_jump.get_json()['error']

    # Attempt unauthorized recruiter update (should be 403)
    unauthorized = client.patch(f'/api/v1/applications/{app_id}/status', json={
        'status': 'shortlisted'
    }, headers=auth_header(recruiter2_user))
    assert unauthorized.status_code == 403

    # Valid step 1: applied -> shortlisted
    step1 = client.patch(f'/api/v1/applications/{app_id}/status', json={
        'status': 'shortlisted',
        'recruiter_remarks': 'Strong resume'
    }, headers=auth_header(recruiter_user))
    assert step1.status_code == 200
    assert step1.get_json()['data']['application']['status'] == 'shortlisted'

    # Valid step 2: shortlisted -> interview_scheduled
    step2 = client.patch(f'/api/v1/applications/{app_id}/status', json={
        'status': 'interview_scheduled'
    }, headers=auth_header(recruiter_user))
    assert step2.status_code == 200
    assert step2.get_json()['data']['application']['status'] == 'interview_scheduled'

    # Valid step 3: interview_scheduled -> selected
    step3 = client.patch(f'/api/v1/applications/{app_id}/status', json={
        'status': 'selected',
        'recruiter_remarks': 'Offer extended and accepted'
    }, headers=auth_header(recruiter_user))
    assert step3.status_code == 200
    assert step3.get_json()['data']['application']['status'] == 'selected'

    # Cannot mutate terminal state 'selected'
    terminal_mutate = client.patch(f'/api/v1/applications/{app_id}/status', json={
        'status': 'rejected'
    }, headers=auth_header(recruiter_user))
    assert terminal_mutate.status_code == 400
    assert 'terminal state' in terminal_mutate.get_json()['error']
