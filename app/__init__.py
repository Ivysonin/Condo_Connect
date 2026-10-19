from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from app.config import Config


db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    from app.controllers.user_controller import user_bp
    from app.controllers.aviso_controller import aviso_bp
    from app.controllers.chamado_controller import chamado_bp
    from app.controllers.adm_controller import admin_bp
    from app.controllers.auth_controller import auth_bp
    from app.controllers.pages_controller import pages_bp
    app.register_blueprint(pages_bp)
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(chamado_bp, url_prefix="/chamado")
    app.register_blueprint(aviso_bp, url_prefix="/avisos")
    app.register_blueprint(user_bp, url_prefix="/users")

    from app.models import user_model, chamado_model, aviso_model
    from app.models.user_model import User

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    return app