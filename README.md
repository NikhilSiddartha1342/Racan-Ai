# Racan AI+ — AI Fashion Assistant & Personal Stylist Lookbook

**Racan AI+** is a full-stack personal styling and wardrobe consultation web application. Powered by Google Gemini AI, it helps users analyze outfits, receive ratings and personalized styling critiques, curate their digital wardrobe canvas, and discover matching fashion items from top e-commerce platforms.

---

## ✨ Features

- **Personal AI Stylist & Consultant**:
  - Get brutally honest outfit critiques, color coordination advice, and body/skin tone matching.
  - Request numerical fit ratings (e.g. `Rating: 8.5/10`) and recommendations for complementary garments (trousers, layers, shoes, accessories).
  - Multi-model automatic fallback (`gemini-3.5-flash-lite`, `gemini-3-flash-preview`, etc.) for zero downtime during demand spikes.
- **Interactive Drag & Drop Wardrobe Canvas**:
  - Upload clothing photos or full-body outfits.
  - Multi-slot lookbook canvas for mixing, matching, and visual planning.
- **Curated Fashion & Shopping Cards**:
  - Automatically identifies matching garments and generates clickable direct shopping links to major fashion platforms (Myntra, Ajio, Tata Cliq, etc.).
- **User Privacy & Account Isolation**:
  - Per-user wardrobe isolation: photos and wardrobe items are securely partitioned per user/email.
  - Automatically resets and clears the lookbook canvas on logout.
- **Authentication**:
  - One-click Google OAuth Sign-In.
  - Guest Mode option for immediate access.
- **Persistent Chat & Sync**:
  - Real-time conversation persistence with MongoDB Atlas synchronization.
  - Dark mode / Light mode toggle.

---

## 🛠️ Tech Stack

- **Frontend**:
  - React 19 + TypeScript
  - Vite
  - Tailwind CSS 4
  - `@react-oauth/google`
- **Backend**:
  - Node.js + Express
  - Mongoose (MongoDB Atlas)
  - CORS, Dotenv
- **AI & Integrations**:
  - Google Gemini API (`@google/genai`)

---

## 📂 Project Structure

```
LookBook-main/
├── components/          # React UI components
│   ├── LoginModal.tsx   # Google OAuth + Guest login modal
│   ├── LogoutModal.tsx  # Confirmation logout modal
│   ├── Sidebar.tsx      # Stylist chat, history & curated shopping cards
│   └── WardrobeCanvas.tsx # Visual lookbook upload & drop canvas
├── server/              # Express backend
│   ├── models/          # MongoDB schemas (User, Chat, LoginHistory)
│   ├── index.js         # API routes & static file server
│   └── package.json
├── services/            # Frontend services
│   ├── geminiService.ts # Gemini AI calls, prompts & link generators
│   └── mongoService.ts  # Chat history synchronization with backend
├── App.tsx              # Main application entry & state management
├── vite.config.ts       # Vite build & API proxy configuration
├── .env.example         # Environment template
└── package.json
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
- A **MongoDB connection string** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 2. Clone the Repository
```bash
git clone https://github.com/NikhilSiddartha1342/Racan-Ai.git
cd Racan-Ai
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
# Google Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string
DB_NAME=Racan_ai_Beta

PORT=5000

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Build and Start
Install dependencies and build both the frontend and backend:
```bash
npm run build
```

Start the production server:
```bash
npm start
```
Visit **`http://localhost:5000`** in your browser.

For local frontend development with hot-reloading:
```bash
npm run dev
```

---

## 🌐 Deployment Instructions

### Deploy on Render (Recommended)

1. Sign in to **[Render.com](https://render.com/)**.
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `NikhilSiddartha1342/Racan-Ai`.
4. Fill in the build settings:
   - **Name**: `racan-ai`
   - **Region**: Select closest to your users (e.g. `Singapore` or `Frankfurt`)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Scroll down to **Environment Variables** and add:
   - `VITE_GEMINI_API_KEY`: *(Your Google Gemini API Key)*
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
   - `MONGODB_URI`: *(Your MongoDB Atlas connection URI)*
   - `DB_NAME`: `Racan_ai_Beta`
   - `VITE_GOOGLE_CLIENT_ID`: `1016992325869-6cp70c0i19v26guldo1bh04d1samekcl.apps.googleusercontent.com`
   - `PORT`: `5000`
6. Click **Deploy Web Service**.
7. Once deployed, copy your assigned Render URL (e.g., `https://racan-ai.onrender.com`).
8. Go to **[Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)**:
   - Edit your OAuth Web Client ID.
   - Under **Authorized JavaScript origins**, add your Render URL: `https://racan-ai.onrender.com`.
   - Click **Save**.

---

### Alternative: Deploy on Railway

1. Go to **[Railway.app](https://railway.app/)** and click **New Project** > **Deploy from GitHub repo**.
2. Select `NikhilSiddartha1342/Racan-Ai`.
3. In the project dashboard under **Variables**, add the same environment variables as above.
4. Under **Settings** > **Networking**, click **Generate Domain**.
5. Add the generated domain to your **Authorized JavaScript origins** in Google Cloud Console.

---

## 📄 License
This project is licensed under the MIT License.
