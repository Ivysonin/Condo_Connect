from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.schemas.user_schema import UserSchema
from app.services.user_service import UserService


user_bp = Blueprint("user", __name__)
schema = UserSchema()


@user_bp.route("/register", methods=["POST"])
def register_user():
    json_data = request.get_json()

    if not json_data:
        return jsonify({"error": "JSON não enviado"}), 400

    errors = schema.validate(json_data)
    if errors:
        return jsonify(errors), 400

    data = schema.load(json_data)

    response, status = UserService.create_user(data)
    return jsonify(response), status


@user_bp.route("/perfil", methods=["GET"])
@login_required
def profile():
    schema = UserSchema(exclude=["senha"])
    return jsonify(schema.dump(current_user)), 200


@user_bp.route("/perfil", methods=["PUT"])
@login_required
def update_user():
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON não enviado"}), 400

    response, status = UserService.update_user(current_user, data)
    return jsonify(response), status