from marshmallow import Schema, fields


class AvisoSchema(Schema):
    id = fields.Int(dump_only=True)
    titulo = fields.Str(required=True)
    conteudo = fields.Str(required=True)
    autor_id = fields.Int(dump_only=True)
    autor = fields.Str(dump_only=True)
    data = fields.DateTime(dump_only=True)
    editavel_ate = fields.DateTime(dump_only=True)