#!/bin/bash

# Simple script to open the ngrok dashboard

# Determine the operating system and open the browser accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open "https://dashboard.ngrok.com/cloud-edge/domains"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux with graphical interface
  if command -v xdg-open &> /dev/null; then
    xdg-open "https://dashboard.ngrok.com/cloud-edge/domains"
  else
    echo "Cannot open browser automatically. Please visit:"
    echo "https://dashboard.ngrok.com/cloud-edge/domains"
  fi
else
  # Other OS
  echo "Cannot open browser automatically. Please visit:"
  echo "https://dashboard.ngrok.com/cloud-edge/domains"
fi

echo "This will take you to your reserved domains page where you can see all your domain reservations."
echo "Look for domains with format: something.ngrok.app" 