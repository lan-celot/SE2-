# Installations needed
run one by one in terminal!

npm install
npm install firebase
npm install -g firebase-tools

# Update All Dependencies & Dev Dependencies (except tailwind)
npx npm-check-updates -u --reject tailwindcss
npm install

# Check for Updates Without Applying Changes
npx npm-check-updates
