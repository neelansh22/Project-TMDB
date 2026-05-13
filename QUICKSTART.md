# Quick Start: Deploy TeneoMemory Dashboard to Azure

⏱️ **Total Time:** 15-20 minutes

## Prerequisites
- Azure CLI installed ([download](https://aka.ms/installazurecli))
- GitHub account
- Azure subscription

---

## Step-by-Step

### 1. Login to Azure (2 min)
```bash
az login
az account set --subscription "<YOUR_SUBSCRIPTION>"
```

### 2. Create Azure Resources (5 min)
```bash
cd dashboard/deploy
bash setup-azure.sh
```

### 3. Configure Environment (2 min)
```bash
bash setup-environment.sh
# Enter DB password when prompted
```

### 4. Get Publish Profile (1 min)
```bash
az webapp deployment list-publishing-profiles \
    --name teneo-memory-dashboard \
    --resource-group teneo-memory-rg \
    --xml > publish-profile.xml

# Copy contents of publish-profile.xml
cat publish-profile.xml
```

### 5. Create GitHub Repo (3 min)
```bash
cd ..  # Back to dashboard directory
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/teneo-memory-dashboard.git
git branch -M main
git push -u origin main
```

### 6. Configure GitHub Secrets (2 min)
Go to: Repository → Settings → Secrets → Actions

Add secrets:
- `AZURE_WEBAPP_PUBLISH_PROFILE` = contents of publish-profile.xml
- `AZURE_RESOURCE_GROUP` = `teneo-memory-rg`
- `NEXTAUTH_URL` = `https://teneo-memory-dashboard.azurewebsites.net`

### 7. Deploy (5 min - automatic)
```bash
git push origin main
```

Watch deployment at: https://github.com/YOUR_USERNAME/teneo-memory-dashboard/actions

### 8. Verify (1 min)
Visit: https://teneo-memory-dashboard.azurewebsites.net  
Login: `admin@teneo.ai` / `admin123`

---

## ✅ Success Criteria
- Dashboard loads in < 1 second
- All pages accessible (Dashboard, Conversations, Operations, Geography, Topics)
- No errors in browser console
- Can view conversation details

---

## Troubleshooting

**Deployment failed?**
```bash
# Check logs
az webapp log tail --name teneo-memory-dashboard --resource-group teneo-memory-rg
```

**502 Bad Gateway?**
```bash
# Restart app
az webapp restart --name teneo-memory-dashboard --resource-group teneo-memory-rg
```

**Need help?** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide.

---

## What's Next?

**Phase 2.1 Complete!** 🎉

Monitor for 24-48 hours, then proceed to:
- **Phase 2.2:** Enhanced authentication with Azure AD
- Production hardening (Key Vault, custom domain, RBAC)

---

## Cost

- Monthly: ~$26 (Azure App Service B2)
- First month may be free with Azure credits

Monitor at: Portal → Cost Management + Billing
