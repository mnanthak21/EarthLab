# EarthLab

## Overview
EarthLab is a full-stack trade visualization application that combines geospatial visualization with trade-supply inference. It uses Google Gemini AI to identify product components, queries UN Comtrade for import data, and displays the results on an interactive 3D globe using Three.js.

## Requirements

### Backend (Python)
```bash
pip install geopandas
pip install comtradeapicall
pip install -q -U google-genai
pip install flask
pip install flask-cors
pip install python-dotenv
```

### Frontend (JavaScript)
```bash
npm install --save three
npm install --save-dev vite
```

## Setup

1. Create a `.env` file with your API keys:
```
COMTRADE_API_CALLS=your_comtrade_api_key_here
GOOGLE_GEN_AI=your_google_gen_ai_key_here
```

2. Generate border coordinates (one-time setup):
```bash
python main.py
```

## Running the Application

### Start Both Frontend and Backend Together (Recommended)
```bash
npm start
```
This will start both the Flask backend on `http://localhost:5000` and the Vite frontend on `http://localhost:5173`

### Or Start Separately

#### Start the Flask Backend
```bash
python backend.py
```
The backend will run on `http://localhost:5000`

#### Start the Frontend (in a separate terminal)
```bash
npm run dev
```
The frontend will run on `http://localhost:5173` (or another port shown in the terminal)

## Usage

1. Open the frontend URL in your browser
2. Enter a product name (e.g., "Ford F150")
3. Enter a country code (e.g., "842" for USA)
4. Click "Analyze" to fetch trade data
5. View the supply chain results in the right panel

