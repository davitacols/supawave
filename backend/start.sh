#!/bin/bash
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn inventory_saas.wsgi:application --bind 0.0.0.0:$PORT