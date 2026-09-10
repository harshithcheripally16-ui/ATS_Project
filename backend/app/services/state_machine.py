class ApplicationStateMachine:
    """
    Section 6 Status State Machine Enforcement.
    Valid transitions:
      applied -> shortlisted | rejected
      shortlisted -> interview_scheduled | rejected
      interview_scheduled -> selected | rejected
      selected -> (terminal)
      rejected -> (terminal)
    """

    ALLOWED_TRANSITIONS = {
        'applied': {'shortlisted', 'rejected'},
        'shortlisted': {'interview_scheduled', 'rejected'},
        'interview_scheduled': {'selected', 'rejected'},
        'selected': set(),
        'rejected': set()
    }

    VALID_STATUSES = set(ALLOWED_TRANSITIONS.keys())

    @classmethod
    def can_transition(cls, current_status: str, target_status: str) -> tuple[bool, str]:
        if target_status not in cls.VALID_STATUSES:
            return False, f"Invalid target status '{target_status}'. Valid statuses are: {', '.join(cls.VALID_STATUSES)}"

        if current_status == target_status:
            return True, "Status unchanged"

        if current_status not in cls.ALLOWED_TRANSITIONS:
            return False, f"Unknown current status '{current_status}'"

        allowed = cls.ALLOWED_TRANSITIONS.get(current_status, set())
        if not allowed:
            return False, f"Cannot change status from terminal state '{current_status}'"

        if target_status not in allowed:
            return False, f"Invalid transition from '{current_status}' to '{target_status}'. Allowed transitions: {', '.join(allowed)}"

        return True, "Transition allowed"
