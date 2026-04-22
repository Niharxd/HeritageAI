@echo off
cd /d "%~dp0frontend"
set "PATH=C:\Program Files\nodejs;%PATH%"
npm run dev -- --host 127.0.0.1 --port 5173
