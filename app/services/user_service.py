from werkzeug.security import generate_password_hash, check_password_hash
from app.schemas.user_schema import UserSchema
from marshmallow import ValidationError
from app.models.user_model import User
from app import db
import re


class UserService:

    @staticmethod
    def create_user(data):
        """
        data = {
            "nome_completo": "",
            "email": "",
            "bloco_apto": "",
            "telefone": "",
            "tipo_usuario": "",
            "senha": ""
        }
        """

        # VALIDAÇÕES DE LÓGICA DE NEGÓCIO

        # Nome: mínimo 3 letras
        nome = data["nome_completo"].strip()
        if not re.match(r"^[A-Za-zÀ-ÿ\s]{3,}$", nome):
            return {"error": "Nome inválido: mínimo 3 letras"}, 400

        # Bloco/Apartamento: A/000
        if not re.match(r"^[A-Z]\/\d{1,3}$", data["bloco_apto"].strip()):
            return {"error": "Bloco/Apartamento inválido: use padrão A/000"}, 400

        # Telefone: mínimo 8 dígitos numéricos
        digits = re.sub(r"\D", "", data["telefone"])
        if len(digits) < 8:
            return {"error": "Telefone inválido: mínimo 8 dígitos"}, 400

        # E-mail não pode repetir
        if User.query.filter_by(email=data["email"].lower()).first():
            return {"error": "E-mail já cadastrado"}, 409

        # Senha: mínimo 6 caracteres
        if len(data["senha"]) < 6:
            return {"error": "Senha muito curta: mínimo 6 caracteres"}, 400

        # NORMALIZAÇÃO

        email_normalizado = data["email"].lower()

        # CRIAÇÃO DO USUÁRIO
        user = User(
            nome_completo=nome,
            email=email_normalizado,
            bloco_apto=data["bloco_apto"],
            telefone=data["telefone"],
            tipo_usuario=data["tipo_usuario"],
            senha_hash=generate_password_hash(data["senha"]),
            ativo=True
        )

        db.session.add(user)
        db.session.commit()

        return {"message": "Usuário cadastrado com sucesso"}, 201

    @staticmethod
    def update_user(user, data):
        """
        data = {
            "nome_completo": "",
            "email": "",
            "bloco_apto": "",
            "telefone": "",
            "senha_atual": "",
            "nova_senha": "",
            "confirmar_senha": ""
        }

        AVISO: Não precisa passar todos os campos, apenas aqueles que vão ser atualizados.
        """

        schema = UserSchema(partial=True)

        # Remove campos que não pertencem ao schema antes de validar
        extra_fields = ["senha_atual", "nova_senha", "confirmar_senha"]
        data_for_schema = {k: v for k, v in data.items() if k not in extra_fields}

        try:
            validated = schema.load(data_for_schema)
        except ValidationError as err:
            return {"errors": err.messages}, 400

        if "nome_completo" in validated:
            nome = validated["nome_completo"].strip()
            if not re.match(r"^[A-Za-zÀ-ÿ\s]{3,}$", nome):
                return {"error": "Nome inválido: mínimo 3 letras"}, 400
            user.nome_completo = nome

        if "email" in validated:
            email = validated["email"].lower()
            if User.query.filter(User.email == email, User.id != user.id).first():
                return {"error": "E-mail já cadastrado"}, 409
            user.email = email

        if "bloco_apto" in validated:
            user.bloco_apto = validated["bloco_apto"]

        if "telefone" in validated:
            digits = re.sub(r"\D", "", validated["telefone"])
            if len(digits) < 8:
                return {"error": "Telefone inválido: mínimo 8 dígitos"}, 400
            user.telefone = validated["telefone"]

        senha_atual = data.get("senha_atual")
        nova_senha = data.get("nova_senha")
        confirmar_senha = data.get("confirmar_senha")
        
        if senha_atual and nova_senha and confirmar_senha:
            # Verifica se a senha atual está correta
            if not check_password_hash(user.senha_hash, senha_atual):
                return {"error": "Senha atual incorreta"}, 400

            # Verifica tamanho mínimo
            if len(nova_senha) < 6:
                return {"error": "A nova senha deve ter no mínimo 6 caracteres"}, 400

            # Verifica se nova senha e confirmação coincidem
            if nova_senha != confirmar_senha:
                return {"error": "As senhas não coincidem"}, 400

            user.senha_hash = generate_password_hash(nova_senha)

        db.session.commit()
        return {"message": "Usuário atualizado com sucesso"}, 200

    @staticmethod
    def update_status(user_id, ativo, requesting_user):
        user = db.session.get(User, user_id)

        if not user:
            return {"error": "Usuário não encontrado"}, 404

        if user.id == requesting_user.id and not ativo:
            return {"error": "Não é possível desativar o próprio usuário"}, 400

        user.ativo = ativo
        db.session.commit()
        return {"message": "Status do usuário atualizado", "ativo": user.ativo}, 200