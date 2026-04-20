# 🚀 SEO Performance Hub (Mull Performance Dashboard)

A high-performance, real-time analytics dashboard designed for SEO and SMM departments to track project delivery, revenue targets, and individual/team productivity.

![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.0+-black?style=for-the-badge&logo=flask&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-Logic%20Engine-150458?style=for-the-badge&logo=pandas&logoColor=white)

---

## 🌟 Key Features

### 📊 Multi-Dimensional Analytics
- **Department Overview**: Real-time tracking of the **$35,000 monthly target**.
- **Team Performance**: Detailed breakdown for **Geo Rankers**, **Rank Riser**, **Search Apex**, and **SMM**.
- **Individual Stat Cards**: Personalized metrics including Delivered Amount, WIP, Revision, and Target progress.

### ⚙️ Intelligent Logic Engine (`agent_engine.py`)
- **Automated Name Normalization**: Maps diverse Google Sheet entries to consistent employee profiles.
- **Fair-Share SPLIT Logic**: Automatically divides project revenue when multiple team members are assigned to a single order.
- **Date-Aware Filtering**: Dynamic month-based filtering (optimized for April 2026) to ensure current performance accuracy.

### 🔄 Seamless Data Pipeline
- **Live GSheet Sync**: Fetches raw data via Google Visualization API or Service Account (GSpread).
- **MongoDB Atlas Integration**: Stores processed summaries for ultra-fast dashboard loading.
- **Manual Data Audit**: Includes scripts for reconciling live data and ensuring parity.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Python / Flask |
| **Data Processing**| Pandas |
| **Database** | MongoDB Atlas |
| **Data Source** | Google Sheets API |
| **Frontend** | Vanilla JS / CSS (Rich UI) |

---

## 🚀 Getting Started

### 1. Prerequisite
Ensure you have Python 3.8+ installed.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/jahidulislamseo/SEO-Performance.git
cd SEO-Performance

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# MongoDB Configuration
MONGO_URI=your_mongodb_atlas_connection_string
DB_NAME=seo_dashboard

# Sheet Configuration
SHEET_ID=your_google_sheet_id
```

*Optional: Place your `creds.json` (Google Service Account key) in the root if using GSpread.*

### 4. Run the Application
```bash
# Start the Logic Engine (to sync data)
python agent_engine.py

# Start the Flask Server
python server.py
```

---

## 📁 System Architecture

- `server.py`: The heart of the application. Hosts the API and serves the dashboard.
- `agent_engine.py`: The "Brain". Handles complex Pandas logic, name normalization, and splits.
- `shared_utils.py`: Centralized configuration and database utility functions.
- `extract_data.py`: Specialized module for fetching raw sheet data.
- `sync_mongo.py`: Lightweight utility for syncing member metadata to the database.
- `static/` & `templates/`: Houses the high-fidelity UI components.

---

## 🛡️ Best Practices
- **Performance**: Pre-calculates summaries in MongoDB to avoid lag during heavy GSheet API calls.
- **Security**: Environment variable isolation for sensitive database and API keys.
- **Reliability**: Dual-mode extraction (Gviz API for speed, GSpread for write operations).

---

Developed with ❤️ by **Jahidul Islam**
