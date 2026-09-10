def test_admin_access_control(client, candidate_user, recruiter_user, auth_header):
    # Candidate trying to access admin users -> 403
    res_cand = client.get('/api/v1/admin/users', headers=auth_header(candidate_user))
    assert res_cand.status_code == 403

    # Recruiter trying to access admin users -> 403
    res_rec = client.get('/api/v1/admin/users', headers=auth_header(recruiter_user))
    assert res_rec.status_code == 403


def test_admin_user_management(client, admin_user, candidate_user, recruiter_user, auth_header):
    admin_headers = auth_header(admin_user)

    # 1. List users and check role ordering: Admin -> Recruiter -> Candidate
    res = client.get('/api/v1/admin/users', headers=admin_headers)
    assert res.status_code == 200
    items = res.get_json()['data']['items']
    assert len(items) >= 3
    # Check that admin comes first
    roles = [u['role'] for u in items]
    admin_idx = roles.index('admin')
    recruiter_idx = roles.index('recruiter')
    candidate_idx = roles.index('candidate')
    assert admin_idx < recruiter_idx < candidate_idx

    # 2. Create user (POST /api/v1/admin/users)
    create_res = client.post('/api/v1/admin/users', json={
        'name': 'Test New Candidate',
        'email': 'testnewcand@example.com',
        'password': 'NewUserPass123!',
        'role': 'candidate',
        'phone': '+91 99999 88888',
        'is_active': True
    }, headers=admin_headers)
    assert create_res.status_code == 201
    created_id = create_res.get_json()['data']['user']['id']

    # 3. Update user (PUT /api/v1/admin/users/<id>)
    update_res = client.put(f'/api/v1/admin/users/{created_id}', json={
        'name': 'Test Updated Candidate',
        'phone': '+91 11111 22222'
    }, headers=admin_headers)
    assert update_res.status_code == 200
    assert update_res.get_json()['data']['user']['name'] == 'Test Updated Candidate'

    # 4. Deactivate candidate
    deact_res = client.patch(f'/api/v1/admin/users/{candidate_user.id}/status', json={'is_active': False}, headers=admin_headers)
    assert deact_res.status_code == 200
    assert deact_res.get_json()['data']['user']['is_active'] is False

    # Deactivated/unverified candidate triggers OTP requirement on login
    login_res = client.post('/api/v1/auth/login', json={
        'email': candidate_user.email,
        'password': 'CandidatePass123!'
    })
    assert login_res.status_code == 200
    assert login_res.get_json()['data']['requires_otp'] is True

    # 5. Delete safety rule: Admin cannot delete him/herself -> 400
    del_self_res = client.delete(f'/api/v1/admin/users/{admin_user.id}', headers=admin_headers)
    assert del_self_res.status_code == 400

    # 6. Delete safety rule: Admin cannot delete another admin -> 403
    # Create second admin
    admin2_res = client.post('/api/v1/admin/users', json={
        'name': 'Second Admin',
        'email': 'admin2@example.com',
        'password': 'AdminPass123!',
        'role': 'admin',
        'is_active': True
    }, headers=admin_headers)
    assert admin2_res.status_code == 201
    admin2_id = admin2_res.get_json()['data']['user']['id']

    del_admin2_res = client.delete(f'/api/v1/admin/users/{admin2_id}', headers=admin_headers)
    assert del_admin2_res.status_code == 403

    # 7. Delete non-admin user -> 200
    del_user_res = client.delete(f'/api/v1/admin/users/{created_id}', headers=admin_headers)
    assert del_user_res.status_code == 200


def test_admin_category_crud(client, admin_user, auth_header):
    admin_headers = auth_header(admin_user)

    # Create category
    create_res = client.post('/api/v1/admin/categories', json={
        'name': 'Cloud & Infrastructure',
        'description': 'DevOps, SRE, and Cloud Architects'
    }, headers=admin_headers)
    assert create_res.status_code == 201
    cat_id = create_res.get_json()['data']['category']['id']

    # Update category
    update_res = client.put(f'/api/v1/admin/categories/{cat_id}', json={
        'name': 'Cloud Infrastructure & SRE'
    }, headers=admin_headers)
    assert update_res.status_code == 200
    assert update_res.get_json()['data']['category']['name'] == 'Cloud Infrastructure & SRE'

    # List categories
    list_res = client.get('/api/v1/admin/categories')
    assert list_res.status_code == 200
    cats = list_res.get_json()['data']['categories']
    assert any(c['id'] == cat_id for c in cats)

    # Delete category
    del_res = client.delete(f'/api/v1/admin/categories/{cat_id}', headers=admin_headers)
    assert del_res.status_code == 200


def test_admin_stats(client, admin_user, auth_header):
    res = client.get('/api/v1/admin/stats', headers=auth_header(admin_user))
    assert res.status_code == 200
    data = res.get_json()['data']
    assert 'users' in data
    assert 'jobs' in data
    assert 'applications' in data
    assert 'interviews' in data
