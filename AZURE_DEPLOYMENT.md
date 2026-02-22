# Azure Function Deployment Guide

## Prerequisites

1. **Azure Account** - Sign up at https://azure.microsoft.com
2. **Azure CLI** - Install from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
3. **Node.js 18+** - Already have it
4. **Azure Functions Core Tools** - Install via npm:
   ```bash
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

## Step 1: Prepare Environment Variables

1. Copy `.env.example` to `azure-function/.env`:
   ```bash
   cp .env.example azure-function/.env
   ```

2. Edit `azure-function/.env` with your actual credentials:
   - **Twilio**: Account SID, Auth Token, Phone Number
   - **Email**: SMTP credentials (Gmail, Outlook, etc.)
   - **Azure Storage**: Connection string (we'll set this up)

## Step 2: Create Azure Resources

### Login to Azure
```bash
az login
```

### Create Resource Group
```bash
az group create --name sms2email-rg --location eastus
```

### Create Storage Account
```bash
az storage account create \
  --name sms2emailstorage \
  --resource-group sms2email-rg \
  --location eastus \
  --sku Standard_LRS
```

### Get Storage Connection String
```bash
az storage account show-connection-string \
  --name sms2emailstorage \
  --resource-group sms2email-rg \
  --query connectionString --output tsv
```
Copy this and add to `azure-function/.env` as `AZURE_STORAGE_CONNECTION_STRING`

### Create Table in Storage
```bash
az storage table create \
  --name ProcessedMessages \
  --account-name sms2emailstorage
```

### Create Function App
```bash
az functionapp create \
  --resource-group sms2email-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name sms2email-function \
  --storage-account sms2emailstorage
```

## Step 3: Deploy Function

### Install Dependencies
```bash
cd azure-function
npm install
```

### Deploy
```bash
func azure functionapp publish sms2email-function
```

## Step 4: Configure Function Settings

### Set Environment Variables in Azure
```bash
az functionapp config appsettings set \
  --name sms2email-function \
  --resource-group sms2email-rg \
  --settings \
    TWILIO_ACCOUNT_SID="your_sid" \
    TWILIO_AUTH_TOKEN="your_token" \
    TWILIO_PHONE_NUMBER="+1234567890" \
    EMAIL_HOST="smtp.gmail.com" \
    EMAIL_PORT="587" \
    EMAIL_USER="your_email@gmail.com" \
    EMAIL_PASSWORD="your_app_password" \
    EMAIL_FROM="your_email@gmail.com" \
    EMAIL_TO="your_email@gmail.com" \
    AZURE_STORAGE_CONNECTION_STRING="your_connection_string"
```

## Step 5: Enable/Disable Function

### Disable (when home)
```bash
az functionapp function delete \
  --name sms2email-function \
  --resource-group sms2email-rg \
  --function-name "TimerTrigger"
```

Or simply pause the Function App:
```bash
az functionapp stop \
  --name sms2email-function \
  --resource-group sms2email-rg
```

### Enable (when traveling)
```bash
az functionapp start \
  --name sms2email-function \
  --resource-group sms2email-rg
```

## Step 6: Monitor Logs

View real-time logs:
```bash
func azure functionapp logstream sms2email-function
```

## Adjusting Timer Frequency

Edit `azure-function/function.json` and change the `schedule` property:

- `0 */5 * * * *` - Every 5 minutes
- `0 */15 * * * *` - Every 15 minutes (default)
- `0 */30 * * * *` - Every 30 minutes
- `0 0 * * * *` - Once daily at midnight

Then redeploy:
```bash
func azure functionapp publish sms2email-function
```

## Cost Estimation

- **Free Tier**: 1,000,000 executions/month free
- **Execution**: ~0.0000002 USD per execution
- **Storage**: ~$0.50/month
- **Typical Monthly Cost**: $0.20-$0.50

## Troubleshooting

**Check function status:**
```bash
az functionapp show --name sms2email-function --resource-group sms2email-rg
```

**View app settings:**
```bash
az functionapp config appsettings list \
  --name sms2email-function \
  --resource-group sms2email-rg
```

**Delete everything (when done):**
```bash
az group delete --name sms2email-rg
```

## Local Testing

Before deploying, test locally:

```bash
cd azure-function
func start
```

This will start the function locally. The timer will trigger every 15 minutes.
