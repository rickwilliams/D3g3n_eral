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

# 2. Start ngrok AFTER the server is confirmed running
log "\n${BLUE}Starting ngrok tunnel to port 4000...${NC}"
# Check if ngrok is already running
if pgrep -x "ngrok" > /dev/null; then
  log "${YELLOW}ngrok is already running. Using existing tunnel.${NC}"
else
  ngrok http 4000 2>&1 | tee -a "$LOG_FILE" &
  NGROK_PID=$!
  PIDS+=($NGROK_PID)
  # Wait a moment for ngrok to start
  sleep 5
fi

# Display ngrok URL - Updated to handle both domain formats
log "${BLUE}Ngrok tunnel information:${NC}"
TUNNELS_JSON=$(curl -s http://127.0.0.1:4040/api/tunnels)
# Try to extract URL directly from JSON instead of using grep
NGROK_URL=$(echo "$TUNNELS_JSON" | grep -o '"public_url":"https://[^"]*"' | sed 's/"public_url":"//g' | sed 's/"//g' | head -n 1)

if [ -z "$NGROK_URL" ]; then
  log "${RED}Could not get ngrok URL. Make sure ngrok is running correctly.${NC}"
  log "${YELLOW}Detailed ngrok status:${NC}"
  echo "$TUNNELS_JSON" | tee -a "$LOG_FILE"
else
  log "${GREEN}Ngrok URL: ${NGROK_URL}${NC}"
fi

# Verify the tunnel is working
log "${YELLOW}Testing ngrok connection...${NC}"
HEALTH_CHECK=$(curl -s "$NGROK_URL/health" 2>&1 || echo "failed")
if [[ $HEALTH_CHECK == *"ok"* ]]; then
  log "${GREEN}Ngrok tunnel verified and working!${NC}"
else
  log "${RED}Could not verify ngrok tunnel. You may need to restart the script.${NC}"
  log "${YELLOW}Response: $HEALTH_CHECK${NC}"
fi

# 3. Start the main ElizaOS server in the foreground
log "\n${BLUE}Starting ElizaOS main application...${NC}"
log "${BLUE}Using character: characters/D3g3n_eral.json${NC}"
log "${GREEN}==========================================${NC}"
log "${GREEN}To test webhooks, open a new terminal and run:${NC}"
log "${YELLOW}cd packages/user-management-api && pnpm test-webhook-simple${NC}"
log "${GREEN}==========================================${NC}"
log "${BLUE}Full logs being saved to: ${LOG_FILE}${NC}"

# Run the main app and capture its output to the log file
pnpm start --characters="characters/D3g3n_eral.json" 2>&1 | tee -a "$LOG_FILE"

# If we get here, the main app exited, so run the cleanup
cleanup 