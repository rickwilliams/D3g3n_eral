#!/bin/bash

# MyApp.sh - Start all components of the ElizaOS application
# This script starts:
# 1. The main ElizaOS server with specified character
# 2. The User Management API server
# 3. The ngrok tunnel pointing to the User Management API

# Set up logging
LOG_DIR="logs"
mkdir -p $LOG_DIR
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="$LOG_DIR/elizaos_startup_$TIMESTAMP.log"

# Function to get the current ngrok URL
get_ngrok_url() {
  local TUNNELS_JSON=$(curl -s http://127.0.0.1:4040/api/tunnels)
  local NGROK_URL=$(echo "$TUNNELS_JSON" | grep -o '"public_url":"https://[^"]*"' | sed 's/"public_url":"//g' | sed 's/"//g' | head -n 1)
  echo "$NGROK_URL"
}

# Function to check if ngrok is running
check_ngrok_running() {
  if pgrep -x "ngrok" > /dev/null; then
    local NGROK_URL=$(get_ngrok_url)
    if [ -n "$NGROK_URL" ]; then
      return 0  # ngrok is running with a valid URL
    fi
  fi
  return 1  # ngrok is not running or no valid URL
}

# Function to log and display messages
log() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

log "Starting ElizaOS Application Suite at $(date)"
log "Logging all output to: $LOG_FILE"

# Store the process IDs to clean up later
PIDS=()

# Set colors for better visibility
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Trap SIGINT (Ctrl+C) to ensure clean shutdown
cleanup() {
  log "\n${YELLOW}Shutting down all processes...${NC}"
  
  # Kill all processes in reverse order
  for pid in "${PIDS[@]}"; do
    if ps -p $pid > /dev/null; then
      log "${YELLOW}Stopping process with PID ${pid}${NC}"
      kill $pid 2>/dev/null
    fi
  done
  
  log "${GREEN}Cleanup complete. Exiting.${NC}"
  log "Full logs available at: $LOG_FILE"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Print header
log "${GREEN}==========================================${NC}"
log "${GREEN}   Starting ElizaOS Application Suite     ${NC}"
log "${GREEN}==========================================${NC}"

# Check if port 4000 is already in use
log "\n${BLUE}Checking if port 4000 is already in use...${NC}"
if lsof -i :4000 > /dev/null 2>&1; then
  log "${YELLOW}Port 4000 is already in use. Attempting to free it...${NC}"
  
  # Get the PID of the process using port 4000
  PORT_PID=$(lsof -t -i :4000)
  if [ -n "$PORT_PID" ]; then
    log "${YELLOW}Killing process $PORT_PID that is using port 4000...${NC}"
    kill -9 $PORT_PID
    sleep 2
    
    # Check if port is now free
    if lsof -i :4000 > /dev/null 2>&1; then
      log "${RED}Failed to free port 4000. Please free it manually and restart.${NC}"
      exit 1
    else
      log "${GREEN}Successfully freed port 4000.${NC}"
    fi
  else
    log "${RED}Could not identify the process using port 4000.${NC}"
    log "${RED}Please free port 4000 manually and restart.${NC}"
    exit 1
  fi
else
  log "${GREEN}Port 4000 is available.${NC}"
fi

# 1. Start the User Management API server in the background
log "\n${BLUE}Starting User Management API server...${NC}"
cd packages/user-management-api
# Set NODE_ENV to development to enable the test endpoints
export NODE_ENV=development
(pnpm build && pnpm start) 2>&1 | tee -a "$LOG_FILE" &
USER_API_PID=$!
PIDS+=($USER_API_PID)
cd ../..

# Wait to make sure the server is actually started
log "${YELLOW}Waiting for User Management API to start...${NC}"
sleep 5

# Verify the API server is running
HEALTH_RESULT=$(curl -s http://localhost:4000/health 2>&1)
if [ $? -ne 0 ]; then
  log "${RED}User Management API server failed to start correctly!${NC}"
  log "${YELLOW}Check the logs for errors.${NC}"
else
  log "${GREEN}User Management API server started successfully on port 4000${NC}"
  log "${GREEN}Health check response: $HEALTH_RESULT${NC}"
fi

# 2. Check and potentially start ngrok AFTER the server is confirmed running
log "\n${BLUE}Checking for ngrok tunnel to port 4000...${NC}"
# Check if ngrok is already running
if check_ngrok_running; then
  log "${YELLOW}ngrok is already running.${NC}"
  NGROK_URL=$(get_ngrok_url)
  log "${GREEN}Using existing ngrok URL: ${NGROK_URL}${NC}"
else
  log "${YELLOW}No ngrok tunnel detected. Starting ngrok with reserved domain...${NC}"
  
  # Replace YOUR_RESERVED_DOMAIN with your actual domain from ngrok account
  RESERVED_DOMAIN="nice-partly-lizard.ngrok-free.app"
  
  log "${BLUE}Starting ngrok with domain: ${RESERVED_DOMAIN}${NC}"
  ngrok http 4000 --domain=${RESERVED_DOMAIN} 2>&1 | tee -a "$LOG_FILE" &
  NGROK_PID=$!
  PIDS+=($NGROK_PID)
  
  # Wait for ngrok to start up
  log "${YELLOW}Waiting for ngrok to start...${NC}"
  sleep 5
  
  # Get the new URL
  NGROK_URL=$(get_ngrok_url)
  if [ -z "$NGROK_URL" ]; then
    log "${RED}Failed to start ngrok properly. Please check your configuration.${NC}"
    log "${YELLOW}You may need to reserve a domain in your ngrok account first.${NC}"
    log "${YELLOW}Exiting...${NC}"
    exit 1
  fi
  
  log "${GREEN}Successfully started ngrok with URL: ${NGROK_URL}${NC}"
fi

# Display ngrok URL information
log "${BLUE}Ngrok tunnel information:${NC}"
NGROK_URL=$(get_ngrok_url)

if [ -z "$NGROK_URL" ]; then
  log "${RED}Could not get ngrok URL. Make sure ngrok is running correctly.${NC}"
else
  log "${GREEN}Ngrok URL: ${NGROK_URL}${NC}"
fi

# Verify the tunnel is working
log "${YELLOW}Testing ngrok connection...${NC}"
HEALTH_CHECK=$(curl -s "${NGROK_URL}/health" 2>&1 || echo "failed")
if [[ $HEALTH_CHECK == *"ok"* ]]; then
  log "${GREEN}Ngrok tunnel verified and working!${NC}"
  log "${GREEN}Webhook URL for your Clerk configuration:${NC}"
  log "${YELLOW}${NGROK_URL}/api/webhooks/clerk${NC}"
  # Save the URL to a file for reference
  echo "${NGROK_URL}/api/webhooks/clerk" > "logs/current_webhook_url.txt"
  log "${GREEN}URL also saved to logs/current_webhook_url.txt${NC}"
else
  log "${RED}Could not verify ngrok tunnel. Please check your setup.${NC}"
  log "${YELLOW}Response: $HEALTH_CHECK${NC}"
fi

# 3. Start the main ElizaOS server in the foreground
log "\n${BLUE}Starting ElizaOS main application...${NC}"
log "${BLUE}Using character: characters/snoop.json${NC}"
log "${GREEN}==========================================${NC}"
log "${GREEN}To test webhooks, open a new terminal and run:${NC}"
log "${YELLOW}cd packages/user-management-api && pnpm test-webhook-simple${NC}"
log "${GREEN}==========================================${NC}"
log "${BLUE}Full logs being saved to: ${LOG_FILE}${NC}"

# Run the main app and capture its output to the log file
pnpm start --characters="characters/snoop.json" 2>&1 | tee -a "$LOG_FILE"

# If we get here, the main app exited, so run the cleanup
cleanup 