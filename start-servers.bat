@echo off
echo Starting Backend and Frontend servers...

start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm run dev"

echo Both servers started!
echo Backend running on http://localhost:5000
echo Frontend running on http://localhost:3000 