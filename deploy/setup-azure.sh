#!/bin/bash
# Azure App Service Deployment Script
# Creates all necessary Azure resources for TeneoMemory Dashboard

set -e

# Configuration
APP_NAME="teneo-memory-dashboard"
RESOURCE_GROUP="teneo-memory-rg"
LOCATION="eastus"  # Same region as Azure SQL for low latency
SKU="B2"  # Basic B2: 2 cores, 3.5GB RAM, $26/month
NODE_VERSION="20-lts"

echo "=========================================="
echo "Azure App Service Deployment Setup"
echo "=========================================="
echo "App Name: $APP_NAME"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "SKU: $SKU"
echo "=========================================="
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
echo "Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Please login:"
    az login
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
echo "✅ Logged in to Azure"
echo "   Subscription: $SUBSCRIPTION"
echo ""

# Create resource group if it doesn't exist
echo "Creating resource group..."
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo "✅ Resource group '$RESOURCE_GROUP' already exists"
else
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo "✅ Created resource group '$RESOURCE_GROUP'"
fi
echo ""

# Create App Service Plan
echo "Creating App Service Plan..."
if az appservice plan show --name "${APP_NAME}-plan" --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "✅ App Service Plan already exists"
else
    az appservice plan create \
        --name "${APP_NAME}-plan" \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku $SKU \
        --is-linux
    echo "✅ Created App Service Plan"
fi
echo ""

# Create Web App
echo "Creating Web App..."
if az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "✅ Web App already exists"
else
    az webapp create \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --plan "${APP_NAME}-plan" \
        --runtime "NODE:${NODE_VERSION}"
    echo "✅ Created Web App"
fi
echo ""

# Configure Web App settings
echo "Configuring Web App settings..."

# Set Node version and startup command
az webapp config set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "node server.js" \
    --linux-fx-version "NODE|${NODE_VERSION}"

# Enable Always On (prevents app from sleeping)
az webapp config set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --always-on true

# Configure general settings
az webapp config appsettings set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        WEBSITES_PORT=3000 \
        NODE_ENV=production \
        WEBSITE_NODE_DEFAULT_VERSION="${NODE_VERSION}"

echo "✅ Web App configured"
echo ""

# Create deployment slot for staging
echo "Creating staging deployment slot..."
if az webapp deployment slot show --name $APP_NAME --resource-group $RESOURCE_GROUP --slot staging &> /dev/null; then
    echo "✅ Staging slot already exists"
else
    az webapp deployment slot create \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --slot staging
    echo "✅ Created staging slot"
fi
echo ""

# Enable Application Insights
echo "Setting up Application Insights..."
if az monitor app-insights component show --app "${APP_NAME}-insights" --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "✅ Application Insights already exists"
else
    az monitor app-insights component create \
        --app "${APP_NAME}-insights" \
        --location $LOCATION \
        --resource-group $RESOURCE_GROUP \
        --application-type web
    
    # Link to Web App
    INSIGHTS_KEY=$(az monitor app-insights component show \
        --app "${APP_NAME}-insights" \
        --resource-group $RESOURCE_GROUP \
        --query instrumentationKey -o tsv)
    
    az webapp config appsettings set \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings \
            APPINSIGHTS_INSTRUMENTATIONKEY=$INSIGHTS_KEY \
            ApplicationInsightsAgent_EXTENSION_VERSION=~3
    
    echo "✅ Application Insights configured"
fi
echo ""

echo "=========================================="
echo "✅ DEPLOYMENT INFRASTRUCTURE READY!"
echo "=========================================="
echo ""
echo "Your Web App URL: https://${APP_NAME}.azurewebsites.net"
echo ""
echo "Next steps:"
echo "1. Configure environment variables (see setup-environment.sh)"
echo "2. Get publish profile for GitHub Actions:"
echo "   az webapp deployment list-publishing-profiles --name $APP_NAME --resource-group $RESOURCE_GROUP --xml"
echo "3. Add publish profile to GitHub Secrets as AZURE_WEBAPP_PUBLISH_PROFILE"
echo "4. Push to main branch to trigger deployment"
echo ""
echo "Useful commands:"
echo "  View logs:    az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo "  Restart app:  az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo "  SSH access:   az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
