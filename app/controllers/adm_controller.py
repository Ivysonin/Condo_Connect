from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.models.user_model import User
from app.schemas.user_schema import UserSchema
from app.services.user_service import UserService


admin_bp = Blueprint("admin", __name__)
schema = UserSchema(many=True)


@admin_bp.route("/usuarios", methods=["GET"])
@login_required
def listar_usuarios_admin():

    if current_user.tipo_usuario != "sindico":
        return jsonify({"error": "Acesso permitido apenas ao síndico"}), 403

    usuarios = User.query.order_by(User.id.desc()).all()
    return jsonify(schema.dump(usuarios)), 200


@admin_bp.route("/usuarios/<int:user_id>", methods=["PATCH"])
@login_required
def atualizar_status_usuario(user_id):
    if current_user.tipo_usuario != "sindico":
        return jsonify({"error": "Acesso permitido apenas ao síndico"}), 403

    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("ativo"), bool):
        return jsonify({"error": "O campo ativo deve ser booleano"}), 400

    response, status = UserService.update_status(user_id, data["ativo"], current_user)
    return jsonify(response), status