# Sora Video Studio

<div align="center">

**A beautiful web application for creating stunning videos with OpenAI's Sora 2 API**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## ✨ Features

### 🎨 **Intelligent Storyboarding**
- Create up to 5 scenes with AI-generated images using GPT Image models
- Drag-and-drop scene reordering for perfect storytelling
- Edit and regenerate scenes on the fly
- Upload custom images as base references

### 🎬 **Video Generation**
- Generate professional videos using Sora 2 and Sora 2 Pro models
- Real-time generation progress tracking
- Use storyboard images as input references
- Support for both conversation-based and storyboard-based workflows

### 💬 **AI-Powered Chat Interface**
- Get intelligent guidance for your video creation
- Refine ideas through conversation
- AI helps structure your narrative
- Persistent chat history with searchable conversations

### 📦 **Comprehensive Export Options**
- Download generated videos in MP4 format
- Export all storyboard images as ZIP
- Export project data as JSON for backup/sharing
- Complete video history management

### 🔐 **Privacy First**
- All data stored locally in your browser
- API keys never leave your device
- No server-side storage of credentials
- Zero data collection

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **OpenAI API key** with access to:
  - Sora 2 API (video generation)

### Installation

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

5. **Enter your API key:**
   You'll be prompted to enter your OpenAI API key on first launch

---

## 📖 How to Use

### Getting Started

When you first open Sora Video Studio, you'll see the main interface with two primary modes:

#### **Conversation Mode** (Default)
Perfect for brainstorming and getting AI assistance:

1. Chat with the AI about your video concept
2. Describe your vision, get suggestions and guidance
3. Refine your ideas through conversation
4. Click **"Generate Video"** to create directly from your chat
5. Switch to Storyboard Mode when ready to visualize scenes

#### **Storyboard Mode**
For precise scene-by-scene video creation:

1. Click the **Storyboard** button in the chat panel header
2. You'll see 5 empty scene slots
3. Click any slot to select it
4. Enter a detailed prompt describing the scene
5. Click **"Create Image"** to generate the scene
6. Repeat for additional scenes (up to 5)
7. Drag scenes to reorder them
8. Upload custom images or regenerate existing ones
9. Click **"Generate Video from Storyboard"** to create your final video

### Advanced Features

#### Model Selection
Toggle between **Sora 2 Base** and **Sora 2 Pro** in the header:
- **Base**: Faster generation, good for testing
- **Pro**: Higher quality, more detailed results

#### History Management
- **Videos** button: View all generated videos, replay, and download
- **Chats** button: Access previous conversations and storyboards
- **New Conversation** button: Start fresh while preserving history

#### Export & Download
- **Export Images**: Download all storyboard images as a ZIP file
- **Export JSON**: Save project data for backup or sharing
- **Download Video**: Get your generated video in MP4 format

#### Settings
Access the Settings panel (⚙️ icon) to:
- Update or remove your API key
- Clear stored data
- Manage preferences

---

## 🎯 Usage Examples

### Example 1: Quick Video from Conversation
```
You: "I want to create a 10-second video of a serene mountain sunset"
AI: [Provides guidance and suggestions]
You: "Make it more dramatic with golden hour lighting"
Click: "Generate Video"
```

### Example 2: Storyboarded Video
```
Scene 1: "Wide shot of snow-capped mountains at dawn"
Scene 2: "Camera slowly pans across the mountain range"
Scene 3: "Zoom in on a lone eagle soaring"
Scene 4: "Sun breaks through clouds in golden rays"
Scene 5: "Final wide shot with warm sunset colors"
```

---

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 15](https://nextjs.org/) | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Zustand](https://github.com/pmndrs/zustand) | Lightweight state management |
| [OpenAI SDK](https://github.com/openai/openai-node) | API integration |
| [dnd-kit](https://dndkit.com/) | Drag-and-drop functionality |
| [JSZip](https://stui.github.io/JSZip/) | ZIP file generation |
| [Vercel Analytics](https://vercel.com/analytics) | Performance monitoring |

---

## 🔌 API Routes

The application includes the following Next.js API routes:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | AI chat completions |
| `/api/images/generate` | POST | Generate images with GPT Image |
| `/api/videos/create` | POST | Start video generation with Sora 2 |
| `/api/videos/status/[id]` | GET | Poll video generation status |
| `/api/videos/list` | GET | List all generated videos |
| `/api/videos/download/[id]` | GET | Download completed video |

All routes act as secure proxies, forwarding your API key from browser storage to OpenAI's endpoints.

---

## 🎨 Design Philosophy

Sora Video Studio features a clean, minimal design inspired by modern productivity tools like Linear and Notion:

- **Paper white background** with subtle textures
- **Teal accent colors** for a calming, creative atmosphere
- **Card-based layouts** with soft shadows for depth
- **Responsive design** that works on all screen sizes
- **Accessible components** following WCAG guidelines

---

## 🛠️ Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build optimized production bundle
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

### Project Structure

```
video-gen/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── chat/          # Chat completions
│   │   ├── images/        # Image generation
│   │   └── videos/        # Video operations
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── chat/             # Chat interface
│   ├── content/          # Content viewers
│   └── ui/               # UI components
├── lib/                  # Utilities and hooks
├── store/                # Zustand state management
└── public/               # Static assets
```

---

## 🔒 Privacy & Security

Your privacy is paramount:

- ✅ **Client-side storage**: API keys stored only in browser localStorage
- ✅ **No backend database**: Zero server-side storage of credentials
- ✅ **No tracking**: We don't collect any user data
- ✅ **Direct API calls**: Your key goes straight to OpenAI
- ✅ **Secure proxying**: API routes only forward requests, never store data

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Getting Help

- **OpenAI Documentation**:
  - [Sora 2 API Docs](https://platform.openai.com/docs/guides/video-generation)
  - [Image Generation Docs](https://platform.openai.com/docs/guides/image-generation)

- **Common Issues**:
  - Ensure your API key has access to Sora 2 and GPT Image models
  - Check browser console for detailed error messages
  - Verify you're using Node.js 18 or higher

### Troubleshooting

**Video generation fails:**
- Verify your OpenAI API key has Sora 2 access
- Check your API usage limits
- Ensure prompts comply with OpenAI's usage policies

**Images not generating:**
- Confirm GPT Image model access in your API plan
- Try simplifying your prompt
- Check for content policy violations

---

## 🙏 Acknowledgments

- Built with [OpenAI's Sora 2](https://openai.com/sora) and GPT Image APIs
- UI inspired by [Linear](https://linear.app) and [Notion](https://notion.so)
- Icons from [Heroicons](https://heroicons.com)