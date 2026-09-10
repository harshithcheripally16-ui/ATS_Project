import io
from app.models import db, Application, Job, User, CandidateProfile, OfferLetter

def test_recruiter_provide_offer_letter_and_candidate_review(client, candidate_user, recruiter_user, recruiter2_user, auth_header):
    # 1. Recruiter creates job
    job_res = client.post('/api/v1/jobs', json={
        'title': 'Principal Cloud Architect',
        'description': 'Lead cloud infrastructure architecture',
        'salary': '$160,000 - $190,000',
        'location': 'San Francisco / Remote',
        'status': 'open'
    }, headers=auth_header(recruiter_user))
    assert job_res.status_code == 201
    job_id = job_res.get_json()['data']['job']['id']

    # 2. Candidate applies
    app_res = client.post('/api/v1/applications', json={'job_id': job_id}, headers=auth_header(candidate_user))
    assert app_res.status_code == 201
    app_id = app_res.get_json()['data']['application']['id']

    # 3. Recruiter advances candidate
    client.patch(f'/api/v1/applications/{app_id}/status', json={'status': 'shortlisted'}, headers=auth_header(recruiter_user))
    client.patch(f'/api/v1/applications/{app_id}/status', json={'status': 'interview_scheduled'}, headers=auth_header(recruiter_user))

    # 4. Unauthorized recruiter attempts to provide offer letter (should be 403)
    unauth_offer = client.post(f'/api/v1/applications/{app_id}/offer', json={
        'position_title': 'Principal Cloud Architect',
        'salary': '$175,000 / year',
        'joining_date': '2026-11-01'
    }, headers=auth_header(recruiter2_user))
    assert unauth_offer.status_code == 403

    # 5. Authorized recruiter provides offer letter with custom details and document upload
    offer_pdf = (io.BytesIO(b"%PDF-1.4 Official Offer Letter Content"), "offer_letter.pdf")
    offer_res = client.post(
        f'/api/v1/applications/{app_id}/offer',
        data={
            'position_title': 'Principal Cloud Architect',
            'department': 'Cloud Engineering',
            'employment_type': 'Full-Time',
            'salary': '$180,000 / year + equity',
            'joining_date': '2026-11-15',
            'location': 'Remote (US/EU)',
            'reporting_manager': 'VP of Engineering',
            'benefits': 'Comprehensive health insurance, 401(k) match, unlimited PTO, $3,000 annual learning stipend',
            'terms': 'Standard employment agreement subject to background check verification',
            'offer_document': offer_pdf
        },
        content_type='multipart/form-data',
        headers=auth_header(recruiter_user)
    )
    assert offer_res.status_code in (200, 201)
    offer_data = offer_res.get_json()['data']['offer_letter']
    assert offer_data['position_title'] == 'Principal Cloud Architect'
    assert offer_data['salary'] == '$180,000 / year + equity'
    assert offer_data['joining_date'] == '2026-11-15'
    assert offer_data['status'] == 'pending'
    assert offer_data['document_url'] is not None
    assert offer_data['document_url'].endswith('.pdf')

    # Verify application status became selected
    app_check = offer_res.get_json()['data']['application']
    assert app_check['status'] == 'selected'

    # 6. Candidate retrieves offer letter
    cand_get = client.get(f'/api/v1/applications/{app_id}/offer', headers=auth_header(candidate_user))
    assert cand_get.status_code == 200
    cand_offer = cand_get.get_json()['data']['offer_letter']
    assert cand_offer['position_title'] == 'Principal Cloud Architect'
    assert cand_offer['reporting_manager'] == 'VP of Engineering'

    # 7. Candidate accepts the offer
    accept_res = client.patch(
        f'/api/v1/applications/{app_id}/offer/respond',
        json={
            'status': 'accepted',
            'notes': 'Excited to join the team on November 15th!'
        },
        headers=auth_header(candidate_user)
    )
    assert accept_res.status_code == 200
    updated_offer = accept_res.get_json()['data']['offer_letter']
    assert updated_offer['status'] == 'accepted'
    assert updated_offer['candidate_notes'] == 'Excited to join the team on November 15th!'
    assert updated_offer['responded_at'] is not None


def test_candidate_decline_offer_letter(client, candidate_user, recruiter_user, auth_header):
    job_res = client.post('/api/v1/jobs', json={
        'title': 'Product Designer',
        'description': 'Lead UI/UX design',
        'status': 'open'
    }, headers=auth_header(recruiter_user))
    job_id = job_res.get_json()['data']['job']['id']

    app_res = client.post('/api/v1/applications', json={'job_id': job_id}, headers=auth_header(candidate_user))
    app_id = app_res.get_json()['data']['application']['id']

    # Recruiter provides offer letter
    offer_res = client.post(f'/api/v1/applications/{app_id}/offer', json={
        'position_title': 'Lead Product Designer',
        'salary': '$130,000 / year',
        'joining_date': '2026-12-01'
    }, headers=auth_header(recruiter_user))
    assert offer_res.status_code in (200, 201)

    # Candidate declines offer
    decline_res = client.patch(
        f'/api/v1/applications/{app_id}/offer/respond',
        json={
            'status': 'declined',
            'notes': 'Accepted another offer closer to home.'
        },
        headers=auth_header(candidate_user)
    )
    assert decline_res.status_code == 200
    assert decline_res.get_json()['data']['offer_letter']['status'] == 'declined'
