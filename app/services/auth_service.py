from flask_login import login_user, logout_user
from werkzeug.security import check_password_hash
from app.models.user_model import User


class AuthService:

    @staticmethod
    def login(email, senha):
        """
        data = {
            "email": "",
            "senha": ""
        }
        """

        user = User.query.filter_by(email=email.lower()).first()

        if not user:
            return {"error": "Usuário não encontrado"}, 404

        if not user.ativo:
            return {"error": "Usuário desativado"}, 403

        if not check_password_hash(user.senha_hash, senha):
            return {"error": "Senha incorreta"}, 401

        login_user(user)
        return {"message": "Login realizado com sucesso"}, 200

    @staticmethod
    def logout():
        logout_user()
        return {"message": "Logout realizado com sucesso"}, 200