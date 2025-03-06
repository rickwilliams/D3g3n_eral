# Targeted Git History Cleanup Plan

Based on the context provided, we don't need to start from scratch. Since the project was difficult to set up initially and the sensitive data is limited to just two specific files, we can use specialized Git tools to clean the history while preserving your work.

## Understanding the Current Situation

- Local repository with some commits containing sensitive data
- GitHub push attempts were blocked due to sensitive data
- Two files with sensitive information:
  1. `characters/D3g3n_eral.json` - Contains OpenAI and Anthropic API keys
  2. `.notes/Accounts Rows.csv` - Contains sensitive information

## Step-by-Step Cleanup Plan

### 1. Backup Your Current Repository

```bash
# Create a full backup of your repository
cp -r elizaOS-v0.25.8 elizaOS-v0.25.8-backup
```

### 2. Install BFG Repo-Cleaner

```bash
# For macOS using Homebrew
brew install bfg

# Alternatively, download the JAR file (requires Java)
# curl -Lo bfg.jar https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
```

### 3. Prepare Your Repository

```bash
# Navigate to your repository
cd elizaOS-v0.25.8

# Create a clean version of the sensitive files (without API keys)
# For D3g3n_eral.json - create a clean placeholder
mkdir -p characters
echo "{}" > characters/D3g3n_eral.json

# For Accounts Rows.csv - create a clean version or placeholder
mkdir -p .notes
echo "id,email,name,username" > .notes/Accounts\ Rows.csv

# Commit these placeholder files
git add characters/D3g3n_eral.json ".notes/Accounts Rows.csv"
git commit -m "Add clean placeholder files"
```

### 4. Clean Repository History

```bash
# Step out of your repository (BFG works on repo from outside)
cd ..

# Use BFG to remove the sensitive files from history
bfg --delete-files "D3g3n_eral.json" elizaOS-v0.25.8
bfg --delete-files "Accounts Rows.csv" elizaOS-v0.25.8

# Go back to repository
cd elizaOS-v0.25.8

# Clean up and optimize repository
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 5. Verify Clean History

```bash
# Check if sensitive files are removed from history
git log --all --name-only --oneline | grep -E "D3g3n_eral.json|Accounts Rows.csv"

# If nothing is returned, your history is clean
```

### 6. Update Remote Repository (GitHub)

```bash
# Force push all branches to GitHub
git push origin --force --all

# Force push all tags
git push origin --force --tags
```

### 7. Recreate D3g3n_eral.json Properly

Now create a proper version of your D3g3n_eral.json file without the sensitive information:

```bash
# Edit the file properly
nano characters/D3g3n_eral.json

# Add to .gitignore if not already there
echo "# Ensure sensitive files are properly ignored" >> .gitignore
echo "characters/**/*.json" >> .gitignore
echo ".notes/" >> .gitignore

# Commit these changes
git add .gitignore characters/D3g3n_eral.json
git commit -m "Add properly configured character file without sensitive data"

# Push to GitHub
git push origin main
```

## Setting Up Proper Secrets Management

### Create a `.env` file for all sensitive data

```bash
# Create a .env file
cat > .env << EOF
# API Keys (with placeholders - replace with your actual keys)
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Character-specific environment variables
CHARACTER.D3G3N_ERAL.OPENAI_API_KEY=your_key_here
CHARACTER.D3G3N_ERAL.ANTHROPIC_API_KEY=your_key_here

# Database credentials
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_API_KEY=your_key_here

# Clerk webhook verification
CLERK_WEBHOOK_SECRET=your_secret_here
EOF

# Make sure .env is in .gitignore
grep "\.env" .gitignore || echo ".env" >> .gitignore
```

### Update your character file

Update your D3g3n_eral.json character file to remove sensitive data and use environment variables:
```json
{
  "name": "D3g3n_eral",
  "description": "Your character description here",
  "settings": {
    "model_provider": "openai",
    "model": "gpt-4o"
    // NO API KEYS HERE!
  }
}
```

### Implement a pre-commit hook to catch sensitive data

```bash
mkdir -p .git/hooks

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Check for sensitive patterns in staged files
sensitive_patterns=(
  "sk-[a-zA-Z0-9]{48}" # OpenAI API key pattern
  "apikey\":\s*\"[^\"]+\"" # Generic API key pattern
  "key\":\s*\"[^\"]+\"" # Generic key pattern
  "password\":\s*\"[^\"]+\"" # Password pattern
  "secret\":\s*\"[^\"]+\"" # Secret pattern
)

for pattern in "${sensitive_patterns[@]}"; do
  if git diff --cached -G"$pattern" | grep -q "$pattern"; then
    echo "ERROR: Potential sensitive data detected in your commit."
    echo "Pattern matched: $pattern"
    echo "Please remove sensitive data before committing."
    exit 1
  fi
done

exit 0
EOF

chmod +x .git/hooks/pre-commit
```

## Additional Security Recommendations

1. **Rotate Your API Keys**: Since they were part of Git history, consider them compromised and generate new ones.

2. **Consider using a Secret Manager**: For more advanced projects, use a proper secrets manager such as:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Google Secret Manager

3. **Implement Environment-Based Configuration**:
   ```bash
   # Create environment-specific files
   cp .env .env.development
   cp .env .env.production
   echo ".env*" >> .gitignore
   ```
