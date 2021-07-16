from flask import Flask
from flask_sqlalchemy import SQLAlchemy

####### RESTART DB? #######
RESTART_DB = False
###########################

db = SQLAlchemy()

def create_app(config_class):
    app = Flask(__name__)

    print(f"STARTING CONFIG MODE: {config_class.MODE}")
    app.config.from_object(config_class)

    app.config["auto_control_humidity"] = True
    app.config["humidifier_state"] = False
    
    db.init_app(app)

    from flask_app.python.main.routes import main
    app.register_blueprint(main)

    print("\nRestart DB set to:", RESTART_DB, '\n')
    
    from flask_app.python.models import SetPoint, LastStatus
    if RESTART_DB is True:
        with app.app_context():
            print("Dropando tabelas")
            db.drop_all()
            print("Criando tabelas")
            db.create_all()
            set_point = SetPoint(
                humidity_set_point = 60.0,
                humidity_deviation = 2.0,
            )
            last = LastStatus(
                humidity = 60.0,
                temperature = 25.0,
                humidifier_state = 0
            )
            db.session.add(set_point)
            db.session.add(last)
            db.session.commit()
            print("Banco de dados restaurado. \n")

    return app
