import os
from flask import Flask, send_from_directory, jsonify, redirect
from flask_cors import CORS
from flasgger import Swagger
from .config import Config
from .models import db, User, JobCategory
from .routes import (
    auth_bp,
    jobs_bp,
    candidates_bp,
    applications_bp,
    interviews_bp,
    admin_bp,
    uploads_bp
)
from .utils import error_response

def create_app(config_class=Config):
    # Determine project root and frontend path
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    frontend_dir = os.path.join(base_dir, 'frontend')

    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_class)

    # Enable CORS for all routes
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize Database
    db.init_app(app)

    # Ensure Upload Directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize Swagger API Documentation (Section 5.7 /docs)
    Swagger(app, template=app.config.get('SWAGGER_TEMPLATE'), config=app.config.get('SWAGGER_CONFIG'))

    # Register API Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(candidates_bp)
    app.register_blueprint(applications_bp)
    app.register_blueprint(interviews_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(uploads_bp)

    # ---------------- Static & Frontend Serving (React SPA Support) ----------------
    dist_dir = os.path.join(frontend_dir, 'dist')

    @app.route('/')
    def index():
        if os.path.exists(os.path.join(dist_dir, 'index.html')):
            return send_from_directory(dist_dir, 'index.html')
        return send_from_directory(os.path.join(frontend_dir, 'pages'), 'index.html')

    @app.route('/assets/<path:filename>')
    def serve_assets(filename):
        if os.path.exists(os.path.join(dist_dir, 'assets', filename)):
            return send_from_directory(os.path.join(dist_dir, 'assets'), filename)
        return send_from_directory(os.path.join(frontend_dir, 'assets'), filename)

    @app.route('/pages/<path:filename>')
    def serve_pages(filename):
        if os.path.exists(os.path.join(dist_dir, 'index.html')):
            return send_from_directory(dist_dir, 'index.html')
        return send_from_directory(os.path.join(frontend_dir, 'pages'), filename)

    @app.route('/css/<path:filename>')
    def serve_css(filename):
        return send_from_directory(os.path.join(frontend_dir, 'css'), filename)

    @app.route('/js/<path:filename>')
    def serve_js(filename):
        return send_from_directory(os.path.join(frontend_dir, 'js'), filename)

    @app.route('/<path:path>')
    def catch_all(path):
        if os.path.exists(os.path.join(dist_dir, path)):
            return send_from_directory(dist_dir, path)
        if path.startswith('api/') or path.startswith('uploads/'):
            return error_response("The requested resource or endpoint was not found", 404)
        if os.path.exists(os.path.join(dist_dir, 'index.html')):
            return send_from_directory(dist_dir, 'index.html')
        return error_response("The requested resource or endpoint was not found", 404)

    # ---------------- Global Error Handlers ----------------
    @app.errorhandler(404)
    def handle_404(e):
        return error_response("The requested resource or endpoint was not found", 404)

    @app.errorhandler(405)
    def handle_405(e):
        return error_response("Method not allowed on this endpoint", 405)

    @app.errorhandler(413)
    def handle_413(e):
        return error_response("File size exceeds the allowed maximum limit (10MB)", 413)

    @app.errorhandler(500)
    def handle_500(e):
        return error_response("An unexpected internal server error occurred", 500)

    # Create tables and seed initial data
    with app.app_context():
        db.create_all()
        seed_initial_data()

    return app


def seed_initial_data():
    """Seed initial administrator, default recruiter, default candidate, categories, and entry-level jobs."""
    from datetime import datetime, timezone
    from .models import Job

    # Seed Admin
    admin_user = User.query.filter_by(email='admin@ats.com').first()
    if not admin_user:
        admin = User(
            name="System Administrator",
            email="admin@ats.com",
            role="admin",
            phone="+1000000000",
            is_active=True
        )
        admin.set_password("AdminPass123!")
        db.session.add(admin)
    else:
        admin_user.is_active = True
        admin_user.set_password("AdminPass123!")

    # Seed Recruiter
    recruiter_user = User.query.filter_by(email='recruiter@ats.com').first()
    if not recruiter_user:
        recruiter = User(
            name="Recruitment Lead",
            email="recruiter@ats.com",
            role="recruiter",
            phone="+1000000001",
            is_active=True
        )
        recruiter.set_password("RecruiterPass123!")
        db.session.add(recruiter)
        db.session.flush()
    else:
        recruiter_user.is_active = True
        recruiter_user.set_password("RecruiterPass123!")

    # Seed Candidate
    candidate_user = User.query.filter_by(email='candidate@ats.com').first()
    if not candidate_user:
        candidate = User(
            name="Demo Candidate",
            email="candidate@ats.com",
            role="candidate",
            phone="+1000000002",
            is_active=True
        )
        candidate.set_password("CandidatePass123!")
        db.session.add(candidate)
        db.session.flush()
    else:
        candidate_user.is_active = True
        candidate_user.set_password("CandidatePass123!")

    # Seed Default Job Categories
    default_categories = [
        ("Engineering", "Software development, QA, DevOps, and cloud engineering roles"),
        ("Product & Design", "Product management, UI/UX design, and research positions"),
        ("Data & AI", "Data science, machine learning, and data analytics positions"),
        ("Marketing & Sales", "Growth, digital marketing, sales development, and account management"),
        ("Human Resources", "Talent acquisition, HR operations, and people management")
    ]
    cat_map = {}
    for name, desc in default_categories:
        cat = JobCategory.query.filter_by(name=name).first()
        if not cat:
            cat = JobCategory(name=name, description=desc)
            db.session.add(cat)
            db.session.flush()
        cat_map[name] = cat.id

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    # Seed Realistic Entry-Level Jobs if no jobs exist
    if Job.query.count() == 0:
        recruiter = User.query.filter_by(role='recruiter').first()
        recruiter_id = recruiter.id if recruiter else 1

        sample_jobs = [
            {
                "title": "Junior Software Engineer",
                "category_name": "Engineering",
                "skills": "Python, Git, SQL, Flask, React",
                "experience": "0–1 years",
                "location": "Bengaluru, Karnataka (Hybrid)",
                "salary": "₹6 - 10 LPA",
                "deadline": datetime.strptime("2026-12-31", "%Y-%m-%d").date(),
                "status": "open",
                "description": "Join our core engineering team to build scalable microservices and user-facing features. You will write clean Python/Flask APIs, collaborate on React UI components, and participate in code reviews and CI/CD deployment pipelines."
            },
            {
                "title": "Product Design Associate",
                "category_name": "Product & Design",
                "skills": "Figma, Wireframing, User Research, Canva, Prototyping",
                "experience": "0–2 years",
                "location": "Mumbai, Maharashtra (Hybrid)",
                "salary": "₹5 - 9 LPA",
                "deadline": datetime.strptime("2026-12-31", "%Y-%m-%d").date(),
                "status": "open",
                "description": "Work alongside senior product designers to create intuitive wireframes, interactive prototypes, and user flows. You will assist with candidate user testing, maintain component libraries, and turn product requirements into clean visual designs."
            },
            {
                "title": "Entry-Level Data Analyst",
                "category_name": "Data & AI",
                "skills": "SQL, Python, Excel, Tableau, Data Visualization",
                "experience": "0–1 years",
                "location": "Hyderabad, Telangana (Hybrid)",
                "salary": "₹6 - 9 LPA",
                "deadline": datetime.strptime("2026-12-31", "%Y-%m-%d").date(),
                "status": "open",
                "description": "Analyze operational recruitment datasets, construct interactive executive dashboards, and generate key business insights. You will run SQL queries, clean raw data pipelines, and partner with cross-functional teams to track core platform metrics."
            },
            {
                "title": "Digital Marketing Associate",
                "category_name": "Marketing & Sales",
                "skills": "SEO, SEM, Google Analytics, Canva, Social Media",
                "experience": "0–2 years",
                "location": "Remote (India)",
                "salary": "₹4.5 - 8 LPA",
                "deadline": datetime.strptime("2026-12-31", "%Y-%m-%d").date(),
                "status": "open",
                "description": "Execute inbound digital marketing initiatives, optimize campaign conversion funnels, and manage social media channels. You will monitor SEO traffic analytics, produce engaging content assets, and assist with automated email outreach campaigns."
            },
            {
                "title": "Junior HR Coordinator",
                "category_name": "Human Resources",
                "skills": "Candidate Sourcing, Screening, ATS, HR Operations, Interviewing",
                "experience": "0–1 years",
                "location": "Gurugram, Haryana (Hybrid)",
                "salary": "₹4 - 7 LPA",
                "deadline": datetime.strptime("2026-12-31", "%Y-%m-%d").date(),
                "status": "open",
                "description": "Support full-lifecycle talent acquisition by sourcing entry-level candidates, reviewing applicant resumes, and scheduling interview pipelines. You will maintain applicant tracking system records and deliver a seamless onboarding experience."
            }
        ]

        for sj in sample_jobs:
            cat_id = cat_map.get(sj["category_name"])
            job = Job(
                recruiter_id=recruiter_id,
                category_id=cat_id,
                title=sj["title"],
                description=sj["description"],
                skills=sj["skills"],
                experience=sj["experience"],
                location=sj["location"],
                salary=sj["salary"],
                deadline=sj["deadline"],
                status=sj["status"]
            )
            db.session.add(job)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    # Seed Candidate Profile and Sample Applications
    from .models import CandidateProfile, Application, Interview
    cand_user = User.query.filter_by(email='candidate@ats.com').first()
    if cand_user:
        profile = CandidateProfile.query.filter_by(user_id=cand_user.id).first()
        if not profile:
            profile = CandidateProfile(
                user_id=cand_user.id,
                skills="Python, Flask, React, TypeScript, Docker, SQL, REST APIs, Git",
                experience="2+ years building enterprise full-stack web applications, designing RESTful APIs in Python/Flask, and implementing reactive UI components in React.",
                education="B.Tech in Computer Science & Engineering, National Institute of Technology (2020–2024)",
                resume_url="/uploads/resumes/sample_resume.pdf"
            )
            db.session.add(profile)
            db.session.flush()
        elif not profile.skills:
            profile.skills = "Python, Flask, React, TypeScript, Docker, SQL, REST APIs, Git"
            profile.experience = "2+ years building enterprise full-stack web applications, designing RESTful APIs in Python/Flask, and implementing reactive UI components in React."
            profile.education = "B.Tech in Computer Science & Engineering, National Institute of Technology (2020–2024)"

        first_job = Job.query.first()
        if first_job and Application.query.filter_by(candidate_id=profile.id, job_id=first_job.id).count() == 0:
            app_cand = Application(
                candidate_id=profile.id,
                job_id=first_job.id,
                status='shortlisted',
                applied_date=datetime.now(timezone.utc),
                recruiter_remarks="Strong portfolio and demonstrated experience in Flask & React."
            )
            db.session.add(app_cand)

    # Ensure all candidate profiles have rich qualifications
    all_profiles = CandidateProfile.query.all()
    for prof in all_profiles:
        if not prof.skills:
            prof.skills = "Python, JavaScript, SQL, React, HTML/CSS, Git, REST APIs"
        if not prof.experience:
            prof.experience = "1+ years experience developing web applications, building responsive interfaces, and writing clean backend services."
        if not prof.education:
            prof.education = "Bachelor of Technology in Computer Science"

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()


