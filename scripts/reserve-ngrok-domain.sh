#!/bin/bash

# Script to reserve a ngrok domain
# This requires a paid ngrok account and an API key

# Set colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if jq is installed
check_jq() {
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed.${NC}"
    echo -e "${YELLOW}Please install jq using:${NC}"
    echo -e "  - Mac: brew install jq"
    echo -e "  - Linux: apt-get install jq or equivalent"
    exit 1
  fi
}

# Check if the NGROK_API_KEY is set
if [ -z "${NGROK_API_KEY}" ]; then
  echo -e "${RED}Error: NGROK_API_KEY environment variable is not set.${NC}"
  echo -e "${YELLOW}Please set your ngrok API key:${NC}"
  echo -e "export NGROK_API_KEY=your_api_key_here"
  echo -e "${YELLOW}You can find your API key at: https://dashboard.ngrok.com/api${NC}"
  exit 1
fi

# Check for jq
check_jq

# Ask for desired domain name
echo -e "${YELLOW}Enter your desired domain name (without .ngrok.app):${NC}"
read domain_name

if [ -z "$domain_name" ]; then
  echo -e "${RED}Error: Domain name cannot be empty.${NC}"
  exit 1
fi

# Confirm with user
echo -e "${YELLOW}About to reserve: ${domain_name}.ngrok.app${NC}"
echo -e "${YELLOW}This will use one of your reserved domain slots. Continue? (y/n)${NC}"
read confirmation

if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
  echo -e "${RED}Operation cancelled.${NC}"
  exit 1
fi

# Reserve the domain
echo -e "${YELLOW}Attempting to reserve ${domain_name}.ngrok.app...${NC}"

response=$(curl -s -X POST "https://api.ngrok.com/reserved_domains" \
  -H "Authorization: Bearer ${NGROK_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Ngrok-Version: 2" \
  -d "{\"name\": \"${domain_name}.ngrok.app\", \"region\": \"us\"}")

# Check if the response contains an error
if echo "$response" | jq -e '.error' >/dev/null; then
  error_code=$(echo "$response" | jq -r '.error_code')
  error_message=$(echo "$response" | jq -r '.error')
  echo -e "${RED}Failed to reserve domain: ${error_code} - ${error_message}${NC}"
  
  # Check for common errors
  if [[ "$error_message" == *"already exists"* ]]; then
    echo -e "${YELLOW}This domain may already be taken. Try another name.${NC}"
  fi
  exit 1
fi

# Extract domain information
domain_url=$(echo "$response" | jq -r '.domain')

# Check if domain was successfully reserved
if [ -n "$domain_url" ] && [ "$domain_url" != "null" ]; then
  echo -e "${GREEN}Successfully reserved: ${domain_url}${NC}"
  echo -e "${YELLOW}You can now use this domain with the ngrok command:${NC}"
  echo -e "  ngrok http 4000 --domain=${domain_url}"
  echo
  echo -e "${YELLOW}Would you like to update MyApp.sh with this domain? (y/n)${NC}"
  read update_script
  
  if [[ "$update_script" =~ ^[Yy]$ ]]; then
    # Extract base domain without .ngrok.app
    base_domain=$(echo "$domain_url" | sed 's/\.ngrok\.app$//')
    
    # Update the MyApp.sh script
    sed -i '' "s/RESERVED_DOMAIN=\"YOUR_RESERVED_DOMAIN.ngrok.app\"/RESERVED_DOMAIN=\"${domain_url}\"/" scripts/MyApp.sh
    
    echo -e "${GREEN}Updated scripts/MyApp.sh with your reserved domain.${NC}"
  fi
else
  echo -e "${RED}Failed to reserve domain. Please check your API key and try again.${NC}"
  echo "$response"
  exit 1
fi

echo -e "${GREEN}Done!${NC}" 