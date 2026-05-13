#!/bin/bash
# Configure Environment Variables in Azure App Service
# Uses Azure Key Vault for sensitive data

set -e

APP_NAME="teneo-memory-dashboard"
RESOURCE_GROUP="teneo-memory-rg"

echo "=========================================="
echo "Environment Variables Configuration"
echo "=========================================="
echo ""

# Generate NEXTAUTH_SECRET if needed
echo "Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "✅ Generated secure NEXTAUTH_SECRET"
echo ""

# Prompt for database password
echo "Enter database password (or press Enter to skip if using Key Vault):"
read -s DB_PASSWORD
echo ""

# Configure environment variables
echo "Setting environment variables..."
az webapp config appsettings set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        DB_SERVER="solutionarch.database.windows.net" \
        DB_DATABASE="teneomemory" \
        DB_USER="teneomemory_app" \
        DB_PASSWORD="$DB_PASSWORD" \
        DB_ENCRYPT="true" \
        NEXTAUTH_URL="https://${APP_NAME}.azurewebsites.net" \
        NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
        DEMO_USERS="admin@teneo.ai:admin123"

echo "✅ Environment variables configured"
echo ""

echo "=========================================="
echo "⚠️  IMPORTANT SECURITY NOTES"
echo "=========================================="
echo ""
echo "1. NEXTAUTH_SECRET has been set to a secure random value"
echo "2. Consider rotating DEMO_USERS password immediately"
echo "3. For production, use Azure Key Vault for DB_PASSWORD:"
echo ""
echo "   # Create Key Vault"
echo "   az keyvault create --name teneo-memory-kv --resource-group $RESOURCE_GROUP --location eastus"
echo ""
echo "   # Store password in Key Vault"
echo "   az keyvault secret set --vault-name teneo-memory-kv --name db-password --value 'YOUR_PASSWORD'"
echo ""
echo "   # Enable system-assigned identity for Web App"
echo "   az webapp identity assign --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "   # Grant Web App access to Key Vault"
echo "   WEBAPP_IDENTITY=\$(az webapp identity show --name $APP_NAME --resource-group $RESOURCE_GROUP --query principalId -o tsv)"
echo "   az keyvault set-policy --name teneo-memory-kv --object-id \$WEBAPP_IDENTITY --secret-permissions get"
echo ""
echo "   # Update DB_PASSWORD to reference Key Vault"
echo "   az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP \\"
echo "       --settings DB_PASSWORD='@Microsoft.KeyVault(SecretUri=https://teneo-memory-kv.vault.azure.net/secrets/db-password/)'"
echo ""
