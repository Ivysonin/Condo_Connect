from flask_login import UserMixin
from app import db


class User(UserMixin, db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    nome_completo = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    bloco_apto = db.Column(db.String(10), nullable=False)
    telefone = db.Column(db.String(20), nullable=False)
    tipo_usuario = db.Column(db.String(20), nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)
    ativo = db.Column(db.Boolean, nullable=False, default=True, server_default=db.true())


    def __repr__(self):
        return f"<Usuario id={self.id} nome={self.nome_completo}>"