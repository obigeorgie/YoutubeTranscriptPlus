# 📝 YouTube Transcript Explorer

A powerful web-based tool that leverages AI to provide advanced YouTube transcript retrieval, analysis, and visualization capabilities.

## ✨ Features

- 🎥 **YouTube Video Transcript Retrieval**
  - Support for multiple languages
  - Real-time timestamp navigation
  - Synchronized video playback

- 🔍 **Advanced Search Capabilities**
  - Full-text search within transcripts
  - Real-time highlighting
  - Navigation between search matches

- 🤖 **AI-Powered Analysis**
  - Automated transcript summarization
  - Key points extraction
  - Smart content insights

- ☁️ **Interactive Word Cloud**
  - Visual representation of key terms
  - Click-to-search functionality
  - Dynamic word sizing based on frequency

- 💾 **Multiple Export Formats**
  - Plain Text (.txt)
  - SubRip Subtitles (.srt)
  - WebVTT (.vtt)

## 🚀 Getting Started

### Prerequisites

- Python 3.11
- OpenAI API key
- YouTube Data API access

### Installation

1. Clone the repository
2. Install dependencies:
```bash
pip install -r requirements.txt
```

### Environment Setup

Create a `.env` file with the following variables:
```
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_session_secret
```

### Running the Application

```bash
python main.py
```
The application will be available at `http://localhost:5000`

## 🎮 Usage Guide

1. **Getting Transcripts**
   - Paste a YouTube URL in the input field
   - Select your preferred language
   - Click "🔍 Get Transcript"

2. **Using AI Analysis**
   - Click the "🤖 AI Analysis" button
   - Choose between "📝 Generate Summary" or "📌 Extract Key Points"
   - View the AI-generated insights

3. **Word Cloud Visualization**
   - Click the "☁️ Word Cloud" button to generate
   - Click on words to search for them in the transcript
   - Explore frequently used terms

4. **Searching Transcripts**
   - Use the search bar to find specific text
   - Navigate between matches using ⬆️ and ⬇️ buttons
   - Clear search with the ❌ button

5. **Downloading Transcripts**
   - Click the "💾 Download" button
   - Choose your preferred format (TXT, SRT, VTT)
   - Save the file to your computer

## 🔧 Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: JavaScript, Bootstrap
- **AI Integration**: OpenAI API
- **Data Processing**: NLTK, WordCloud
- **API Integration**: YouTube Transcript API

## 💡 UI Design

The application features a clean, minimalistic interface with:
- Emoji-based navigation for intuitive user experience
- Dark theme optimized for readability
- Responsive layout for all screen sizes
- Clearly organized controls and features
- Interactive elements with visual feedback

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.