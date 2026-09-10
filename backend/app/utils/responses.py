import math
from flask import jsonify

def success_response(data=None, message="Success", status_code=200):
    payload = {
        'success': True,
        'message': message
    }
    if data is not None:
        payload['data'] = data
    return jsonify(payload), status_code

def error_response(error_message="An error occurred", status_code=400, details=None):
    payload = {
        'success': False,
        'error': error_message
    }
    if details is not None:
        payload['details'] = details
    return jsonify(payload), status_code

def paginated_response(items, page: int, limit: int, total: int, message="Success"):
    total_pages = math.ceil(total / limit) if limit > 0 else 1
    payload = {
        'success': True,
        'message': message,
        'data': {
            'items': items,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        }
    }
    return jsonify(payload), 200
