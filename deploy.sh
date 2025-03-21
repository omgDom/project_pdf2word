#!/bin/bash

# Create necessary directories
sudo mkdir -p /var/www/simpledoc/app/credentials
sudo mkdir -p /var/www/simpledoc/app/uploads

# Set proper permissions
sudo chown -R www-data:www-data /var/www/simpledoc
sudo chmod -R 750 /var/www/simpledoc

# Create specific secure directory for credentials
sudo chmod 700 /var/www/simpledoc/app/credentials

# Move client_secrets.json to credentials directory
if [ -f "client_secrets.json" ]; then
    sudo mv client_secrets.json /var/www/simpledoc/app/credentials/
    sudo chown www-data:www-data /var/www/simpledoc/app/credentials/client_secrets.json
    sudo chmod 600 /var/www/simpledoc/app/credentials/client_secrets.json
fi

# Create uploads directory with proper permissions
sudo chmod 750 /var/www/simpledoc/app/uploads

# Copy environment file
if [ -f ".env" ]; then
    sudo cp .env /var/www/simpledoc/.env
    sudo chown www-data:www-data /var/www/simpledoc/.env
    sudo chmod 600 /var/www/simpledoc/.env
fi

echo "Directory structure and permissions set up complete" 