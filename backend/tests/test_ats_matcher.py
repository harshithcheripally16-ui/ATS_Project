import pytest
from app.services.ats_matcher import AtsMatcherService
from app.models import db, User, CandidateProfile, JobCategory, Job, Application
from app.utils import generate_auth_token
from types import SimpleNamespace


def test_ats_matcher_service_strong_match():
    candidate = SimpleNamespace(
        skills="Python, Flask, Docker, PostgreSQL, React",
        experience="5 years of software engineering",
        education="B.S. in Computer Science"
    )
    job = SimpleNamespace(
        title="Senior Python Backend Engineer",
        skills="Python, Flask, PostgreSQL",
        experience="4 years"
    )

    result = AtsMatcherService.calculate_match(candidate, job)
    assert result['score'] >= 80
    assert result['rating'] == 'Strong Match'
    assert 'Python' in result['matched_skills']
    assert 'Flask' in result['matched_skills']
    assert 'Postgresql' in result['matched_skills']
    assert len(result['missing_skills']) == 0
    assert result['breakdown']['skills_score'] == 100


def test_ats_matcher_service_partial_and_missing_skills():
    candidate = SimpleNamespace(
        skills="HTML, CSS, JavaScript",
        experience="1 year frontend web development",
        education="High School Diploma"
    )
    job = SimpleNamespace(
        title="Senior Cloud Architect",
        skills="Kubernetes, AWS, Terraform, Python, Go",
        experience="8 years"
    )

    result = AtsMatcherService.calculate_match(candidate, job)
    assert result['score'] < 50
    assert result['rating'] in ('Low Match', 'Moderate Match')
    assert len(result['missing_skills']) > 0


def test_ats_matcher_empty_or_none():
    result = AtsMatcherService.calculate_match(None, None)
    assert result['score'] == 0
    assert result['rating'] == 'Low Match'


def test_application_to_dict_includes_ats_match(app, candidate_user, recruiter_user):
    with app.app_context():
        category = JobCategory.query.first()
        if not category:
            category = JobCategory(name="Category Match Test", description="Test")
            db.session.add(category)
            db.session.flush()

        job = Job(
            recruiter_id=recruiter_user.id,
            category_id=category.id,
            title="Full Stack Python Developer",
            description="Build scalable apps with Python and Flask",
            skills="Python, Flask, SQL, React",
            experience="3 years",
            location="Remote",
            salary="$120k",
            status="open"
        )
        db.session.add(job)
        db.session.flush()

        cand_profile = CandidateProfile.query.filter_by(user_id=candidate_user.id).first()
        application = Application(
            candidate_id=cand_profile.id,
            job_id=job.id,
            status='applied'
        )
        db.session.add(application)
        db.session.commit()

        app_dict = application.to_dict(include_details=True)
        assert 'ats_match' in app_dict
        assert app_dict['ats_match'] is not None
        assert 'score' in app_dict['ats_match']
        assert 'rating' in app_dict['ats_match']
        assert 'matched_skills' in app_dict['ats_match']
        assert 'missing_skills' in app_dict['ats_match']


def test_applications_sort_by_ats_match(app, client, recruiter_user, auth_header):
    with app.app_context():
        category = JobCategory.query.first()
        if not category:
            category = JobCategory(name="Tech Sort Test", description="Tech")
            db.session.add(category)
            db.session.flush()

        job = Job(
            recruiter_id=recruiter_user.id,
            category_id=category.id,
            title="Lead Python Architect",
            description="Python architect role",
            skills="Python, Flask, Docker, Kubernetes, AWS",
            experience="5 years",
            location="San Francisco, CA",
            status="open"
        )
        db.session.add(job)
        db.session.flush()

        # Create low match candidate
        user_low = User(name="Junior Frontend", email="low@test.com", role="candidate")
        user_low.set_password("Pass123!")
        db.session.add(user_low)
        db.session.flush()
        prof_low = CandidateProfile(user_id=user_low.id, skills="CSS, HTML, Photoshop", experience="1 year")
        db.session.add(prof_low)
        db.session.flush()
        app_low = Application(candidate_id=prof_low.id, job_id=job.id, status="applied")
        db.session.add(app_low)

        # Create high match candidate
        user_high = User(name="Senior Python Dev", email="high@test.com", role="candidate")
        user_high.set_password("Pass123!")
        db.session.add(user_high)
        db.session.flush()
        prof_high = CandidateProfile(user_id=user_high.id, skills="Python, Flask, Docker, Kubernetes, AWS", experience="6 years")
        db.session.add(prof_high)
        db.session.flush()
        app_high = Application(candidate_id=prof_high.id, job_id=job.id, status="applied")
        db.session.add(app_high)

        db.session.commit()

        headers = auth_header(recruiter_user)

        res = client.get('/api/v1/applications?sort=match', headers=headers)
        assert res.status_code == 200
        data = res.get_json()
        items = data['data']['items']
        assert len(items) >= 2
        # First item should be higher score than second item
        score1 = items[0]['ats_match']['score']
        score2 = items[1]['ats_match']['score']
        assert score1 >= score2
        assert items[0]['candidate']['name'] == "Senior Python Dev"

