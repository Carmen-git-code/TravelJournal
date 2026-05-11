#!/bin/bash
# -------------------------------------------------------------------------
# AWS EC2 User Data Script (Amazon Linux 2023)
# Purpose: Installs Node.js, clones the Travel Journal API from GitHub, 
#          injects DB credentials, and starts the Node server in the background.
# -------------------------------------------------------------------------

dnf update -y
dnf install -y git

dnf install -y nodejs npm

npm install -g pm2

mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

git clone https://github.com/Carmen-git-code/TravelJournal

cd backend

cat << EOF > .env
PORT=8080
DB_HOST=travel-journal-db.cs148sgewmaa.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=var.db_password
DB_NAME=travel_journal_db
EOF

npm install

pm2 start server.js --name "travel-journal-api"

pm2 startup systemd -u root --hp /root
pm2 save
