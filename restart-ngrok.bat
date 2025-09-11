@echo off
echo Restarting SupaWave backend...
cd /d "d:\supawave\backend"
start "Django Server" cmd /k "python manage.py runserver 0.0.0.0:8000"
timeout /t 3
start "Ngrok Tunnel" cmd /k "ngrok http 8000"
echo.
echo SupaWave is starting up!
echo Check the ngrok terminal for your new URL
echo Then update your frontend deployment
pause