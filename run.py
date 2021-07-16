from flask import current_app

from flask_app import create_app
from flask_app.config import Developer, Production

import threading

app = create_app(config_class=Production)

from flask_app.python.main.utils import controlThread
thread1 = controlThread("Control Thread", app)
thread1.start()

if __name__ == '__main__':
    app.run(host='192.168.15.26')
