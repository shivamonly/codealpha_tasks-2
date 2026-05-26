#!/bin/bash

echo "🚀 Starting Core Project Management..."
echo ""
echo "Installing backend dependencies..."
cd backend
npm install

echo ""
echo "Setting up database..."
npm run db:push

echo ""
echo "Adding sample data..."
npm run seed

echo ""
echo "✅ Setup complete! Starting server..."
echo ""
npm start
