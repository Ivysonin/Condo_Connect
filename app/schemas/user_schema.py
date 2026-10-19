from marshmallow import Schema, fields, validates, ValidationError
import re


class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    nome_completo = fields.Str(required=True)
    email = fields.Email(required=True)
    bloco_apto = fields.Str(required=True)
    telefone = fields.Str(required=True)
    tipo_usuario = fields.Str(required=True)
    senha = fields.Str(required=True, load_only=True)
    ativo = fields.Bool(dump_only=True)
    

    @validates("bloco_apto")
    def validate_bloco_apto(self, value, **kwargs):
        if not re.match(r"^[A-Z]\/\d{1,4}$", value):
            raise ValidationError("Formato deve ser A/303")

    @validates("tipo_usuario")
    def validate_tipo_usuario(self, value, **kwargs):
        if value not in ["morador", "sindico"]:
            raise ValidationError("Tipo inválido")