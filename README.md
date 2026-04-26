# CodeSense 🧠

> **Learn to build with AI**

CodeSense is an AI-powered code tutor that takes any programming file, breaks it into logical segments, and lets you chat with an AI tutor about each segment — in any personality you choose.

Built for people who are tired of copying code without understanding it.

---

## The Problem

AI tools like ChatGPT and GitHub Copilot make it dangerously easy to generate code without understanding it. People are becoming dependent on AI to write code they can't read, debug, or explain.

CodeSense fights that.

---

## What CodeSense Does

1. **Upload** any programming file
2. **Choose** a tutor personality — strict professor, friendly big brother, Sherlock Holmes, anything
3. **Explore** your code broken into a recursive tree of segments
4. **Click** any segment to open a chat and learn exactly what it does, how it works, and why it matters
5. **Download** a full explanation report as PDF or Word

---

## Demo

> Coming soon

---

## Supported Languages

| Language | Parser |
|---|---|
| Python | `ast` module |
| JavaScript | Groq AI |
| TypeScript | Groq AI |
| Java | Groq AI |
| C# | Groq AI |
| C | Groq AI |
| C++ | Groq AI |
| HTML | Groq AI |
| CSS | Groq AI |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python + Flask |
| AI Model | LLaMA 3.3 via Groq API |
| Python Parser | Python `ast` module |
| PDF Export | fpdf2 |
| Word Export | python-docx |

---

## Project Structure

```
code-sense/
├── app.py                  — Flask server, all API routes
├── agent.py                — Groq API functions (explain, chat, parse)
├── tools.py                — Code parser (ast + AI)
├── requirements.txt        — Python dependencies
├── .env.example            — Environment variable template
├── .gitignore              — Files excluded from GitHub
└── static/
    ├── index.html          — All pages (Hero, Upload, About, Working)
    ├── style.css           — Black, Gold, Cyan theme + animations
    └── script.js           — Interactivity, segment rendering, chatbox
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/code-sense.git
cd code-sense
```

### 2. Create a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up your API key

Create a `.env` file in the root of the project:

```bash
cp .env.example .env
```

Open `.env` and add your Groq API key:

```
GROQ_API_KEY=your-groq-api-key-here
```

Get a free Groq API key at [https://console.groq.com](https://console.groq.com)

### 5. Run the app

```bash
python app.py
```

Open your browser and go to:

```
http://localhost:5000
```

---

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/analyze` | Upload file, get recursive segment tree |
| POST | `/explain` | Get AI explanation of a single segment |
| POST | `/chat` | Send follow-up message in segment chatbox |
| POST | `/download` | Download full explanation report |

---

## Features

- 🧠 AI-powered code explanation using LLaMA 3.3
- 🌲 Recursive segment tree — drill as deep as the code goes
- 💬 Interactive chatbox per segment with conversation memory
- 🎭 Fully customizable tutor personality
- 📄 Downloadable PDF and Word report
- 🌐 Supports 9 programming languages
- ⚡ Fast responses via Groq API

---

## Roadmap

- [ ] Multiple file upload and project-wide analysis
- [ ] GitHub repository URL input
- [ ] Segment relationship diagram
- [ ] Quiz mode — AI tests your understanding
- [ ] Voice tutor
- [ ] VS Code extension
- [ ] User accounts and saved sessions

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

MIT License — feel free to use, modify, and distribute.

---

## Author

Built by a beginner, for beginners. 

- GitHub — coming soon
- Email — coming soon

---

> *"The best way to learn code is to read code. The best way to read code is to have someone explain it."*
