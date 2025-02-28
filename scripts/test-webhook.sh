#!/bin/bash

# Script to test the Clerk webhook endpoint
# Uses the URL saved by MyApp.sh

# Set colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the URL from the saved file
URL_FILE="logs/current_webhook_url.txt"

if [ ! -f "$URL_FILE" ]; then
  echo -e "${RED}Webhook URL file not found!${NC}"
  echo -e "${YELLOW}Please start the application first using 'pnpm startApp'${NC}"
  exit 1
fi

URL=$(cat "$URL_FILE")

echo -e "${YELLOW}Testing Clerk webhook at: $URL${NC}"

# Sample webhook payload that simulates a character creation event
PAYLOAD='{
  "data": {
    "id": "test_12345",
    "type": "user.created",
    "object": "event",
    "data": {
      "id": "user_test_12345",
      "first_name": "Test",
      "last_name": "Character",
      "profile_image_url": "https://example.com/avatar.png",
      "email_addresses": [
        {"email_address": "test@example.com"}
      ],
      "metadata": {
        "character_type": "demo",
        "character_traits": "friendly, helpful, knowledgeable"
      }
    }
  },
  "svix_id": "msg_test_12345",
  "svix_timestamp": "1677270726",
  "svix_signature": "test_signature"
}'

# Send test webhook request
echo -e "${YELLOW}Sending test webhook payload...${NC}"
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$PAYLOAD" "$URL")

# Check response
if [ -z "$RESPONSE" ]; then
  echo -e "${RED}No response received. Make sure the server is running.${NC}"
else
  echo -e "${GREEN}Response received:${NC}"
  echo "$RESPONSE"
  echo -e "${GREEN}Webhook test completed!${NC}"
fi

echo -e "${YELLOW}Note: This is a test with invalid signature. Real Clerk webhooks will have valid signatures.${NC}" 