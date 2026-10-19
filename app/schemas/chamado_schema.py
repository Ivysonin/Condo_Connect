from marshmallow import Schema, fields


class ChamadoSchema(Schema):
    id = fields.Int(dump_only=True)
    titulo = fields.Str(required=True)
    categoria = fields.Str(required=True)
    descricao = fields.Str(required=True)
    status = fields.Str(required=True)
    autor_id = fields.Int(dump_only=True)
    autor = fields.Str(dump_only=True)
    data = fields.DateTime(dump_only=True)