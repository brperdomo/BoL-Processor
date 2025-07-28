# 🚀 Quick Start Guide - Nutrient BOL Processor

Get the Nutrient BOL Processor running on your local machine in under 5 minutes!

## ⚡ Super Quick Setup

### For Mac Users:
```bash
# 1. Install prerequisites (if needed)
brew install node@20 git

# 2. Clone and setup
git clone <your-repo-url>
cd nutrient-bol-processor
chmod +x setup.sh
./setup.sh

# 3. Start the app
npm run dev
```

### For Windows Users:
```cmd
REM 1. Download and install (if needed):
REM    - Node.js 20+ from https://nodejs.org/
REM    - Git from https://git-scm.com/

REM 2. Clone and setup
git clone <your-repo-url>
cd nutrient-bol-processor
setup.bat

REM 3. Start the app
npm run dev
```

🎉 **Open http://localhost:5000 and start processing BOL documents!**

---

## 🔧 Development vs Production Modes

### Development Mode (Default)
- **No API keys required** - uses mock processing
- **Instant setup** - works immediately after `npm run dev`
- **Perfect for testing** - simulates real BOL extraction

### Production Mode (Real AI Processing)
1. **Get API keys**:
   - XTractFlow: Contact [Nutrient Sales](https://www.nutrient.io/contact-sales/)
   - OpenAI: Get key from [platform.openai.com](https://platform.openai.com/account/api-keys)

2. **Configure environment**:
   ```bash
   # Copy template and edit
   cp .env.example .env
   
   # Add your keys to .env file:
   XTRACTFLOW_API_URL=https://your-xtractflow-endpoint.com
   XTRACTFLOW_API_KEY=your-api-key-here
   OPENAI_API_KEY=your-openai-key-here
   ```

3. **Optional: Run XTractFlow service locally**:
   ```bash
   cd dotnet-service
   dotnet run --urls=http://localhost:8080
   ```

---

## 📁 What You'll See

After starting the app, you'll have:

- **📤 Upload Zone**: Drag & drop BOL documents (PDF, JPG, PNG, TIFF)
- **📊 Processing Tabs**:
  - **Processing**: Documents being analyzed
  - **Processed**: Successfully extracted data
  - **Needs Validation**: Manual review required
  - **Unprocessed**: Failed documents
- **🔍 Data Extraction**: Structured JSON output with:
  - BOL numbers, shipper/consignee info
  - Carrier details and shipping dates
  - **Individual cargo items** with separate weights, quantities, descriptions

---

## ❗ Troubleshooting

**Port 5000 in use?**
```bash
# Mac/Linux:
PORT=3000 npm run dev

# Windows:
set PORT=3000 && npm run dev
```

**Installation issues?**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Need help?** Check the full [README.md](README.md) for detailed troubleshooting.

---

## 🎯 Key Features You Can Test

1. **Upload BOL documents** - Try the sample BOL in `attached_assets/`
2. **Watch real-time processing** - Status updates every 2 seconds
3. **View extracted data** - Click on processed documents to see JSON output
4. **Test validation workflow** - Low-confidence extractions need manual review
5. **Download results** - Export structured data for your systems

---

**Ready to process your first BOL? Drop a document into the upload zone and watch the magic happen! ✨**