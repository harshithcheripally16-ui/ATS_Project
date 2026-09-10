import re
from typing import Dict, Any, List, Optional


class AtsMatcherService:
    @staticmethod
    def _clean_tokens(text: Optional[str]) -> List[str]:
        if not text:
            return []
        raw_items = re.split(r'[,;\n/|]+', text)
        cleaned = []
        for item in raw_items:
            norm = item.strip().lower()
            if norm and len(norm) > 1:
                cleaned.append(norm)
        return cleaned

    @staticmethod
    def _extract_years(text: Optional[str]) -> Optional[float]:
        if not text:
            return None
        match = re.search(r'(\d+(?:\.\d+)?)\s*(?:-|to|\+)?\s*(?:\d+(?:\.\d+)?)?\s*(?:years?|yrs?)', text, re.IGNORECASE)
        if match:
            try:
                return float(match.group(1))
            except (ValueError, IndexError):
                pass
        single_digit = re.search(r'\b(\d+(?:\.\d+)?)\b', text)
        if single_digit:
            try:
                val = float(single_digit.group(1))
                if val <= 50:
                    return val
            except ValueError:
                pass
        return None

    @classmethod
    def calculate_match(cls, candidate: Any, job: Any) -> Dict[str, Any]:
        fallback = {
            'score': 0,
            'rating': 'Low Match',
            'matched_skills': [],
            'missing_skills': [],
            'breakdown': {
                'skills_score': 0,
                'experience_score': 0,
                'role_score': 0
            }
        }

        if not candidate or not job:
            return fallback

        # 1. SKILL MATCHING (Weight: 60%)
        job_skills = cls._clean_tokens(getattr(job, 'skills', None) or '')
        candidate_skills = cls._clean_tokens(getattr(candidate, 'skills', None) or '')
        cand_exp_text = (getattr(candidate, 'experience', '') or '').lower()
        cand_edu_text = (getattr(candidate, 'education', '') or '').lower()
        full_cand_text = f"{' '.join(candidate_skills)} {cand_exp_text} {cand_edu_text}".lower()

        matched_skills: List[str] = []
        missing_skills: List[str] = []

        if job_skills:
            for j_skill in job_skills:
                found = False
                for c_skill in candidate_skills:
                    if j_skill == c_skill or j_skill in c_skill or c_skill in j_skill:
                        found = True
                        break
                if not found:
                    escaped = re.escape(j_skill)
                    if re.search(rf'\b{escaped}\b', full_cand_text, re.IGNORECASE):
                        found = True

                display_name = j_skill.title()
                if found:
                    matched_skills.append(display_name)
                else:
                    missing_skills.append(display_name)

            skills_score = (len(matched_skills) / len(job_skills)) * 100.0
        else:
            skills_score = 75.0

        # 2. EXPERIENCE LEVEL MATCHING (Weight: 25%)
        job_years = cls._extract_years(getattr(job, 'experience', None) or '')
        cand_years = cls._extract_years(getattr(candidate, 'experience', None) or '')

        if job_years is not None and job_years > 0:
            if cand_years is not None:
                if cand_years >= job_years:
                    exp_score = 100.0
                else:
                    exp_score = max(30.0, (cand_years / job_years) * 100.0)
            else:
                exp_score = 65.0 if cand_exp_text else 20.0
        else:
            exp_score = 100.0 if cand_exp_text else 80.0

        # 3. ROLE ALIGNMENT (Weight: 15%)
        job_title = (getattr(job, 'title', '') or '').lower()
        role_tokens = [t for t in re.findall(r'\b[a-z]{3,}\b', job_title) if t not in {'and', 'the', 'for', 'with'}]
        matched_role_tokens = [t for t in role_tokens if t in full_cand_text]

        if role_tokens:
            role_score = (len(matched_role_tokens) / len(role_tokens)) * 100.0
        else:
            role_score = 70.0

        # OVERALL WEIGHTED CALCULATION
        final_score = round(0.60 * skills_score + 0.25 * exp_score + 0.15 * role_score)
        final_score = max(0, min(100, final_score))

        if final_score >= 80:
            rating = 'Strong Match'
        elif final_score >= 60:
            rating = 'Good Match'
        elif final_score >= 40:
            rating = 'Moderate Match'
        else:
            rating = 'Low Match'

        return {
            'score': final_score,
            'rating': rating,
            'matched_skills': matched_skills,
            'missing_skills': missing_skills,
            'breakdown': {
                'skills_score': round(skills_score),
                'experience_score': round(exp_score),
                'role_score': round(role_score)
            }
        }
