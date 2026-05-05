# EduNest 🎓

EduNest is an AI-powered study companion that helps students instantly generate study materials, formulas, flashcards, and interactive quizzes from their own documents and notes. Built with modern web technologies and powered by the Google Gemini API.

## ✨ Features

- **Smart Document Analysis**: Upload `.docx`, `.pptx`, or images, and let AI extract the core concepts.
- **Auto-Generated Study Material**: Automatically generates:
  - High-yield formulas (rendered beautifully with LaTeX/KaTeX)
  - Condensed short notes
  - Active-recall flashcards
- **AI Quiz Generation**: Create custom MCQs based on your uploaded materials with adjustable difficulty and exam types.
- **Instant Evaluation**: Take quizzes directly in the app and get instant feedback with detailed explanations.
- **Section Regeneration**: Specifically regenerate formulas, notes, or flashcards without reprocessing the entire document.

## 🛠️ Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS 4
- Framer Motion (Animations)
- KaTeX (Math rendering)
- Lucide React (Icons)

**Backend**
- Python 3 + FastAPI
- Google Gemini API (`gemini-2.5-flash-lite`)
- python-docx & python-pptx (Document parsing)
- Pillow (Image processing)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.8+
- A Google Gemini API Key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend/edunest-api
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   .\venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   Create a `.env` file in the `backend/edunest-api` directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend/edunest-ui
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env.local` file in the `frontend/edunest-ui` directory and configure the backend URL:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173` in your browser.

## 📁 Project Structure

```text
edunest/
├── backend/
│   └── edunest-api/       # FastAPI backend, Gemini integration, Document parsing
└── frontend/
    └── edunest-ui/        # React application, UI components, Tailwind styling
```

## 📜 License

This project is open-source and available under the MIT License.
