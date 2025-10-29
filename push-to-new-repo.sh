#!/bin/bash
# After creating the new GitHub repo, run this script

echo "Adding new remote..."
git remote add boa-origin git@github.com:Grinder2713/boa-security-alert.git 2>/dev/null || git remote set-url boa-origin git@github.com:Grinder2713/boa-security-alert.git

echo "Pushing to new repository..."
git push boa-origin main

echo ""
echo "✅ Done! Your code is now at: https://github.com/Grinder2713/boa-security-alert"
echo ""
echo "Next steps:"
echo "1. Go to Render dashboard"
echo "2. Create a NEW Web Service"
echo "3. Connect to the NEW repo: boa-security-alert"
echo "4. Your URL will be: https://boa-security-alert.onrender.com"
