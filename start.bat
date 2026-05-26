@echo off
echo 🚀 Starting Core Project Management...
echo.
echo Installing backend dependencies...
cd backend
call npm install

echo.
echo Setting up database...
call npm run db:push

echo.
echo Adding sample data...
call npm run seed

echo.
echo ✅ Setup complete! Starting server...
echo.
npm start
