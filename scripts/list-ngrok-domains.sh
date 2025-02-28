#!/bin/bash

# Script to list all reserved ngrok domains
# This requires a ngrok account and an API key

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

echo -e "${YELLOW}Listing your reserved ngrok domains...${NC}"

# List reserved domains
response=$(curl -s "https://api.ngrok.com/reserved_domains" \
  -H "Authorization: Bearer ${NGROK_API_KEY}" \
  -H "Ngrok-Version: 2")

# Check if the response contains an error
if echo "$response" | jq -e '.error' >/dev/null; then
  error_code=$(echo "$response" | jq -r '.error_code')
  error_message=$(echo "$response" | jq -r '.error')
  echo -e "${RED}Failed to list domains: ${error_code} - ${error_message}${NC}"
  exit 1
fi

# Check if there are any domains
domains_count=$(echo "$response" | jq -r '.reserved_domains | length')

if [ "$domains_count" -eq 0 ]; then
  echo -e "${YELLOW}You don't have any reserved domains.${NC}"
  exit 0
fi

# Display domains
echo -e "${GREEN}Found ${domains_count} reserved domain(s):${NC}"
echo

# Loop through domains and display them
for i in $(seq 0 $((domains_count-1))); do
  domain=$(echo "$response" | jq -r ".reserved_domains[$i].domain")
  region=$(echo "$response" | jq -r ".reserved_domains[$i].region")
  created_at=$(echo "$response" | jq -r ".reserved_domains[$i].created_at")
  
  echo -e "${GREEN}Domain:${NC} $domain"
  echo -e "${GREEN}Region:${NC} $region"
  echo -e "${GREEN}Created:${NC} $created_at"
  echo
  
  # Ask if the user wants to update the MyApp.sh script with this domain
  echo -e "${YELLOW}Would you like to update MyApp.sh with this domain? (y/n)${NC}"
  read update_script
  
  if [[ "$update_script" =~ ^[Yy]$ ]]; then
    # Update the MyApp.sh script
    sed -i '' "s/RESERVED_DOMAIN=\"YOUR_RESERVED_DOMAIN.ngrok.app\"/RESERVED_DOMAIN=\"${domain}\"/" scripts/MyApp.sh
    
    echo -e "${GREEN}Updated scripts/MyApp.sh with your reserved domain: ${domain}${NC}"
    break
  fi
done

echo -e "${GREEN}Done!${NC}" 