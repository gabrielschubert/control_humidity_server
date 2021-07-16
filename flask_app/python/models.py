from flask_app import db
from datetime import datetime


class Data(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    temperature = db.Column(db.Float, unique=False, nullable=False)
    humidity = db.Column(db.Float, unique=False, nullable=False)
    humidifier_state = db.Column(db.Integer, unique=False, nullable=False)
    time = db.Column(db.DateTime, default=datetime.utcnow, unique=False, nullable=False)

    @property
    def serialize(self):
        return {
            'id': self.id,
            'temperature': self.temperature,
            'humidity': self.humidity,
            'humidifier_state': self.humidifier_state,
            'time': self.time,
        }

class SetPoint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    humidity_set_point = db.Column(db.Float, unique=False, nullable=False)
    humidity_deviation = db.Column(db.Float, unique=False, nullable=False)

    @property
    def serialize(self):
        return {
            'humidity_set_point': self.humidity_set_point,
            'humidity_deviation': self.humidity_deviation,
        }

class LastStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    humidity = db.Column(db.Float, unique=False, nullable=False)
    temperature = db.Column(db.Float, unique=False, nullable=False)
    humidifier_state = db.Column(db.Integer, unique=False, nullable=False)

    @property
    def serialize(self):
        return {
            'humidity': self.humidity,
            'temperature': self.temperature,
            'humidifier_state': self.humidifier_state,
        }
