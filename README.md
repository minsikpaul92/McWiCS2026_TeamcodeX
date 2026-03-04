# 🤝 Quietly
### AI-Powered Friendship Platform for Introverts
**Developed for Hack McWiCS 2026**

---

## 📌 Overview

**Quietly** is an AI-powered friendship matching platform designed especially for introverts who want to build meaningful connections in a safe, comfortable, and pressure-free environment. 

The platform uses an **AI Dynamic Interviewer** to understand your personality and connects you with "Kindred Spirits" through a privacy-first journey involving anonymous trials and mutual reveals.

---

## 💡 Our Solution: The Introvert's Journey

1. **AI-Driven Discovery**  
   Instead of a static profile, an AI interviewer chats with you to extract your true interests and personality "vibe."

2. **Anonymous Active Trials**  
   Connect with matches as "Anonymous Spirits." Interact without the pressure of identity, focusing purely on compatibility.

3. **Inner Circle & Reveal**  
   Once ready, add a match to your **Inner Circle** to reveal their real identity and build a lasting connection.

4. **Consent-Based Control**  
   Feeling a mismatch? Use the **Disconnect** feature to end trials or friendships at any time, protecting your mental space.

---

## 🌟 Key Features

- 🤖 **AI Dynamic Interviewer**: Context-aware onboarding that adapts to your responses.
- 🎯 **Vibe-Based Matching**: Proprietary matching engine filtering for >70% compatibility.
- 🔒 **Identity Masking**: Real names and details are hidden until mutual trust is established.
- ⚡ **Multi-Match Trials**: Say "Hi" to multiple kindred spirits at once from your discovery feed.
- 🛡️ **Inner Circle Management**: Robust friend list management with identity reveal and disconnect functionality.
- 🎨 **Minimalist & Calming UI**: A high-contrast, dark-mode design focused on focus and tranquility.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14+ (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Shadcn/UI](https://ui.shadcn.com/)
- **Icons**: Lucide React

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Database**: [MongoDB](https://www.mongodb.com/) (Atlas)
- **Engine**: Custom Python-based AI Matching & Analysis Engine

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Instance (or Atlas URI)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend/` directory:
```env
MONGO_URI=your_mongodb_atlas_uri
OPENAI_API_KEY=your_key_here
```
Run the server:
```bash
python -m uvicorn main:app --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

---

## 🏗️ Project Structure

```text
McWiCS2026/
├── backend/
│   ├── core/           # DB & Config
│   ├── engine/         # AI & Matching Logic
│   ├── routes/         # API Endpoints (Auth, Users, Matches, Chat)
│   └── main.py         # App Entry Point
├── client/
│   ├── app/            # Next.js Pages (Dashboard, Matches, Onboarding)
│   ├── components/     # Reusable UI Components
│   └── public/         # Assets
└── README.md
```

---

## 🧑‍💻 Development Team

* **Minsik (Paul) Kim** (Lead Developer)
* **Arunraj Elanchezhian**
* **Khai Ngo**

---

## 🏆 Hackathon
Built with ❤️ for **Hack McWiCS 2026** (McGill Women in Computer Science).

---

## 📄 License
MIT License
