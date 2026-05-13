# Phase 2.1: Azure App Service Deployment Guide

## Overview

This guide walks you through deploying the TeneoMemory Dashboard to Azure App Service with automated CI/CD via GitHub Actions.

**Infrastructure:**
- **Platform**: Azure App Service (Basic B2 tier)
- **Deployment**: Automated via GitHub Actions
- **Database**: Azure SQL Database (existing: solutionarch.database.windows.net)
- **Monitoring**: Application Insights
- **Cost**: ~$26/month

---

## Prerequisites

### 1. Install Azure CLI

**Windows (PowerShell):**
```powershell
winget install -e --id Microsoft.AzureCLI
```

**Mac:**
```bash
brew install azure-cli
```

**Linux:**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

Verify installation:
```bash
az --version
```

### 2. Login to Azure

```bash
az login
```

Select your subscription:
```bash
az account list --output table
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"
```

### 3. GitHub Account

Ensure you have access to create a GitHub repository for the project.

---

## Deployment Steps

### Step 1: Create Azure Resources

Run the automated setup script:

```bash
cd dashboard/deploy
bash setup-azure.sh
```

This creates:
- ✅ Resource Group: `teneo-memory-rg`
- ✅ App Service Plan: `teneo-memory-dashboard-plan` (B2 tier)
- ✅ Web App: `teneo-memory-dashboard`
- ✅ Staging Slot: `staging`
- ✅ Application Insights: `teneo-memory-dashboard-insights`

**Expected time:** 3-5 minutes

### Step 2: Configure Environment Variables

Run the environment setup script:

```bash
bash setup-environment.sh
```

When prompted, enter your database password. This configures:
- Database connection settings
- NextAuth.js configuration (auto-generates secure secret)
- Demo user credentials

**Security Note:** For production, migrate to Azure Key Vault (instructions provided by script).

### Step 3: Get Publish Profile for GitHub Actions

```bash
az webapp deployment list-publishing-profiles \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --xml > publish-profile.xml
```

Copy the contents of `publish-profile.xml` (you'll need this for GitHub).

### Step 4: Create GitHub Repository

From the project root directory:

```bash
cd ..  # Go back to dashboard directory
git init
git add .
git commit -m "Initial commit: TeneoMemory Dashboard"
```

Create a new repository on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/teneo-memory-dashboard.git
git branch -M main
git push -u origin main
```

### Step 5: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

1. **AZURE_WEBAPP_PUBLISH_PROFILE**
   - Value: Contents of `publish-profile.xml`

2. **AZURE_RESOURCE_GROUP**
   - Value: `teneo-memory-rg`

3. **NEXTAUTH_URL**
   - Value: `https://teneo-memory-dashboard.azurewebsites.net`

### Step 6: Trigger Deployment

Push to main branch to trigger the first deployment:

```bash
git push origin main
```

Go to **Actions** tab in GitHub to monitor the deployment progress.

**Expected deployment time:** 3-5 minutes

### Step 7: Verify Deployment

Once deployment completes:

1. Visit: https://teneo-memory-dashboard.azurewebsites.net
2. Login with: `admin@teneo.ai` / `admin123`
3. Verify dashboard loads in < 1 second
4. Check that all pages work (Dashboard, Conversations, Operations, Geography, Topics)

---

## Post-Deployment Configuration

### Enable Custom Domain (Optional)

```bash
# Add custom domain
az webapp config hostname add \
    --webapp-name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --hostname yourdomain.com

# Enable SSL
az webapp config ssl bind \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --certificate-thumbprint <THUMBPRINT> \
    --ssl-type SNI
```

### Configure Scaling (Optional)

**Manual scaling:**
```bash
az appservice plan update \
    --name teneo-memory-dashboard-plan \
    --resource-group teneo-memory-rg \
    --sku S1  # Upgrade to Standard tier for auto-scale
```

**Auto-scaling rules:**
```bash
az monitor autoscale create \
    --resource-group teneo-memory-rg \
    --resource teneo-memory-dashboard-plan \
    --resource-type Microsoft.Web/serverfarms \
    --name autoscale-rules \
    --min-count 1 \
    --max-count 3 \
    --count 1
```

### Migrate Database Password to Key Vault

For production security, store sensitive credentials in Azure Key Vault:

```bash
# 1. Create Key Vault
az keyvault create \
    --name teneo-memory-kv \
    --resource-group teneo-memory-rg \
    --location eastus

# 2. Store password
az keyvault secret set \
    --vault-name teneo-memory-kv \
    --name db-password \
    --value "YourSecurePassword123!"

# 3. Enable managed identity for Web App
az webapp identity assign \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg

# 4. Grant access to Key Vault
WEBAPP_IDENTITY=$(az webapp identity show \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --query principalId -o tsv)

az keyvault set-policy \
    --name teneo-memory-kv \
    --object-id $WEBAPP_IDENTITY \
    --secret-permissions get

# 5. Update DB_PASSWORD to reference Key Vault
az webapp config appsettings set \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --settings DB_PASSWORD='@Microsoft.KeyVault(SecretUri=https://teneo-memory-kv.vault.azure.net/secrets/db-password/)'
```

---

## Monitoring & Troubleshooting

### View Application Logs

**Real-time logs:**
```bash
az webapp log tail \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg
```

**Download logs:**
```bash
az webapp log download \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --log-file app-logs.zip
```

### View Application Insights

Go to Azure Portal → Resource Groups → `teneo-memory-rg` → `teneo-memory-dashboard-insights`

Key metrics to monitor:
- Response time (should be < 1 second for cached queries)
- Failed requests
- Active connections to database
- Memory usage

### Common Issues

**Issue: App won't start**
```bash
# Check startup logs
az webapp log tail --name teneo-memory-dashboard --resource-group teneo-memory-rg

# Verify Node version
az webapp config show --name teneo-memory-dashboard --resource-group teneo-memory-rg --query linuxFxVersion
```

**Issue: Database connection errors**
```bash
# Verify environment variables are set
az webapp config appsettings list \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --query "[?name=='DB_SERVER' || name=='DB_DATABASE' || name=='DB_USER']"

# Check if password is set (won't show value for security)
az webapp config appsettings list \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --query "[?name=='DB_PASSWORD']"
```

**Issue: Slow performance**
```bash
# Verify connection pooling is working (check logs for connection count)
# Should see same pool being reused across requests

# Check database cache tables
# Connect to Azure SQL and run:
# SELECT COUNT(*) FROM [TeneoMemory].[OverallSummaryCache];
# SELECT COUNT(*) FROM [TeneoMemory].[DailySummaryCache];
```

**Issue: 502 Bad Gateway**
```bash
# Restart the app
az webapp restart \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg

# If persists, check build logs in GitHub Actions
```

### SSH into App Service

For advanced debugging:
```bash
az webapp ssh \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg
```

Once inside:
```bash
# Check running processes
ps aux | grep node

# Check environment variables
env | grep DB_

# Test database connection
node -e "console.log(process.env.DB_SERVER)"
```

---

## Updating the Application

### Via GitHub Actions (Recommended)

Simply push changes to main branch:
```bash
git add .
git commit -m "Update: description of changes"
git push origin main
```

GitHub Actions will automatically build and deploy.

### Manual Deployment

For emergency hotfixes:

```bash
# Build locally
npm run build

# Create deployment package
cd .next/standalone
zip -r ../../deploy.zip .
cd ../..

# Deploy
az webapp deployment source config-zip \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --src deploy.zip
```

### Using Staging Slot (Blue-Green Deployment)

1. Deploy to staging:
```bash
az webapp deployment source config-zip \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --slot staging \
    --src deploy.zip
```

2. Test staging: https://teneo-memory-dashboard-staging.azurewebsites.net

3. Swap to production:
```bash
az webapp deployment slot swap \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --slot staging
```

---

## Cost Management

### Current Monthly Costs

- **App Service Plan (B2):** ~$26/month
- **Application Insights:** $0 (up to 5GB data/month)
- **Outbound data transfer:** Minimal (same region as database)
- **Key Vault (if used):** $0.03 per 10,000 operations

**Total estimated:** $26-30/month

### Cost Optimization Tips

1. **Use staging slot wisely** - Stop when not testing
   ```bash
   az webapp stop --name teneo-memory-dashboard --resource-group teneo-memory-rg --slot staging
   ```

2. **Monitor Application Insights data volume**
   ```bash
   az monitor app-insights component show \
       --app teneo-memory-dashboard-insights \
       --resource-group teneo-memory-rg \
       --query "properties.IngestionMode"
   ```

3. **Review logs regularly** - Delete old log files
   ```bash
   az webapp log config --name teneo-memory-dashboard \
       --resource-group teneo-memory-rg \
       --web-server-logging filesystem \
       --level error
   ```

4. **Set up budget alerts** in Azure Portal

---

## Security Checklist

Before going to production:

- [ ] Rotate default admin password in `DEMO_USERS`
- [ ] Migrate `DB_PASSWORD` to Azure Key Vault
- [ ] Enable HTTPS only (should be default)
- [ ] Review and restrict CORS settings if needed
- [ ] Set up Azure AD authentication (Phase 2.2)
- [ ] Enable managed identity for Azure SQL connection
- [ ] Configure firewall rules for Azure SQL
- [ ] Set up regular database backups
- [ ] Enable Application Insights alerts for errors
- [ ] Review GitHub Actions secrets access

---

## Rollback Procedure

If deployment causes issues:

### Option 1: Revert via Git
```bash
git revert HEAD
git push origin main
```

### Option 2: Swap staging back
```bash
az webapp deployment slot swap \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --slot staging
```

### Option 3: Redeploy previous version
Find successful deployment in GitHub Actions → Re-run workflow

---

## Next Steps: Phase 2.2

Once Phase 2.1 is successfully deployed and stable:

1. ✅ Verify dashboard is accessible at public URL
2. ✅ Confirm connection pooling is working (check logs)
3. ✅ Validate performance (<1s load time)
4. ✅ Monitor for 24-48 hours

Then proceed to **Phase 2.2: Enhanced Authentication**
- Replace credentials-based auth with Azure AD
- Implement role-based access control (RBAC)
- Add user management interface
- Configure SSO for organization

---

## Support Resources

- **Azure App Service Docs:** https://docs.microsoft.com/en-us/azure/app-service/
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Application Insights:** https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview
- **Azure Key Vault:** https://docs.microsoft.com/en-us/azure/key-vault/

---

## Deployment Checklist

### Pre-Deployment
- [ ] Azure CLI installed and logged in
- [ ] Database connection tested locally
- [ ] Environment variables documented
- [ ] GitHub account ready
- [ ] Azure subscription has sufficient credits

### During Deployment
- [ ] `setup-azure.sh` completed successfully
- [ ] `setup-environment.sh` configured variables
- [ ] GitHub repository created
- [ ] GitHub secrets configured
- [ ] First deployment succeeded

### Post-Deployment
- [ ] Public URL accessible
- [ ] Login working with demo credentials
- [ ] All dashboard pages load correctly
- [ ] Performance meets expectations (<1s)
- [ ] Application Insights collecting data
- [ ] Logs accessible via Azure CLI

### Production Readiness
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Database password in Key Vault
- [ ] Admin password changed
- [ ] Monitoring alerts set up
- [ ] Backup strategy defined
- [ ] Documentation updated
