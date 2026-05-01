#!/bin/bash
# -------------------------------------------------------------------------
# AWS EC2 User Data Script (Amazon Linux 2023)
# Purpose: Installs Node.js, clones the Travel Journal API from GitHub, 
#          injects DB credentials, and starts the Node server in the background.
# -------------------------------------------------------------------------

# 1. Update the system and install Git
dnf update -y
dnf install -y git

# 2. Install Node.js (Amazon Linux 2023 includes Node.js natively)
dnf install -y nodejs npm

# 3. Install PM2 globally (This keeps the Node server running 24/7)
npm install -g pm2

# 4. Create an application directory and clone your repository
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

# IMPORTANT: Update this URL to match your actual GitHub repository URL!
git clone https://github.com/Carmen-git-code/TravelJournal

# Navigate into the backend folder where server.js lives
cd backend

# 5. Inject the environment variables (.env)
# IMPORTANT: Before pasting this into AWS, replace the endpoint and password!
cat << EOF > .env
PORT=8080
DB_HOST=travel-journal-db.cs148sgewmaa.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=var.db_password
DB_NAME=travel_journal_db
EOF

# 6. Install the Node.js dependencies required by your code
npm install

# 7. Start the backend API using PM2
pm2 start server.js --name "travel-journal-api"

# 8. Configure PM2 to automatically restart the server if the EC2 instance reboots
pm2 startup systemd -u root --hp /root
pm2 save
