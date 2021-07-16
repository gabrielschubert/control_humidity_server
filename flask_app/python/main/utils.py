from flask import current_app

from flask_app import db
from flask_app.python.models import Data, SetPoint, LastStatus

from datetime import datetime

import Adafruit_DHT
import threading
import time
import subprocess

class controlThread (threading.Thread):
    def __init__(self, name, app):
        threading.Thread.__init__(self)
        self.name = name
        self.counter = 0
        self.app = app
        self.save_after = 60
        self.humidity_mean = 0
    def run(self):
        print ("Starting " + self.name)
        with self.app.app_context():
            humidifier(0)            
            while True:
                humidity, temperature = get_humidity_temperature(pin_number = 2, DHT_SENSOR = Adafruit_DHT.DHT22)
                update_last_status(humidity, temperature)
                #print(f'{self.counter} - State: {current_app.config["humidifier_state"]}, {humidity}%,  {temperature}°C')
                
                set_point = get_set_point()
                if humidity <=  set_point['humidity_set_point'] - set_point['humidity_deviation']:
                    if current_app.config["humidifier_state"] == 0:
                        while humidity <=  set_point['humidity_set_point'] - set_point['humidity_deviation']:
                            if current_app.config["auto_control_humidity"] == True:
                                humidifier(1)
                            #print(f'{self.counter} - State: {current_app.config["humidifier_state"]}, {humidity}%,  {temperature}°C')
                            humidity, temperature = get_humidity_temperature(pin_number = 2, DHT_SENSOR = Adafruit_DHT.DHT22)
                            update_last_status(humidity, temperature)
                            set_point = get_set_point()
                            self.humidity_mean = self.humidity_mean + humidity
                            self.counter+=1

                            if self.counter == self.save_after:
                                self.save_to_db(humidity, temperature)
                            
                            time.sleep(1)
                
                if current_app.config["humidifier_state"] != 0 and current_app.config["auto_control_humidity"] == True:
                    humidifier(0)

                self.humidity_mean = self.humidity_mean + humidity
                self.counter+=1

                if self.counter == self.save_after:
                    self.save_to_db(humidity, temperature)

                time.sleep(1)

    def save_to_db(self, humidity, temperature):
        humidity = round(self.humidity_mean/self.counter, 1)
        print(f'Saving Data to DB: {datetime.now()}, State: {current_app.config["humidifier_state"] }, {humidity}%,  {temperature}°C')
        data = Data(
            temperature = temperature,
            humidity = humidity,
            humidifier_state = current_app.config["humidifier_state"],
            time = datetime.now(),
        )
        db.session.add(data)
        db.session.commit()
        self.humidity_mean = 0
        self.counter = 0

def humidifier(state):
    if state == True or state == 1:
        subprocess.run(['sudo', 'uhubctl', '-l', '1-1', '-p', '2', '-a', '1'], stdout=subprocess.PIPE)
        current_app.config["humidifier_state"] = True
        return(True)
    elif state == False or state == 0:
        subprocess.run(['sudo', 'uhubctl', '-l', '1-1', '-p', '2', '-a', '0'], stdout=subprocess.PIPE)
        current_app.config["humidifier_state"] = False
        return(False)

def update_last_status(humidity, temperature):    
    last = db.session.query(LastStatus).get(1)
    if last:
        last.humidity = humidity
        last.temperature = temperature
        last.humidifier_state = current_app.config["humidifier_state"] 
    else:
        last = LastStatus(
            humidity = humidity,
            temperature = temperature,
            humidifier_state = current_app.config["humidifier_state"] 
        )
        db.session.add(last)
    db.session.commit()

def get_last_status():
    last = db.session.query(LastStatus).get(1)
    return(last.serialize)

def get_set_point():
    set_point = db.session.query(SetPoint).get(1)
    return(set_point.serialize)

def get_humidity_temperature(pin_number = 2, DHT_SENSOR = Adafruit_DHT.DHT22):
    humidity, temperature = None, None
    while humidity == None or temperature == None:
        humidity, temperature = Adafruit_DHT.read_retry(DHT_SENSOR, pin_number)

        if humidity == None or temperature == None:
            #print("Error, none, none")
            pass
        else:
            humidity, temperature = round(humidity, 2), round(temperature, 2)

            if 0<=humidity<=99.9:
                return(humidity, temperature)
            else:
                #print("Error, humidity")
                humidity, temperature = None, None
        time.sleep(1)