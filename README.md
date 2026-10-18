# GranthAstraX ⚡

<div align="center">

![GranthAstraX Banner](https://img.shields.io/badge/GranthAstraX-Precision%20Studio-D4AF37?style=for-the-badge&logo=latex&logoColor=black)

**The Unified Precision Suite for Academic Research, LaTeX Typesetting, Document Engineering & Print-Ready Book Production.**

[![Live Web Application](https://img.shields.io/badge/Live%20Demo-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://granthastrax.netlify.app/)
[![Backend API](https://img.shields.io/badge/Render-API%20Live-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://granthastrax.onrender.com/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Bangadhipati/granthastrax)

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

### [🌐 Launch GranthAstraX Studio](https://granthastrax.netlify.app/) • [📡 Backend Status](https://granthastrax.onrender.com/health) • [📖 Documentation](#table-of-contents)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Core Studios & Capabilities](#-core-studios--capabilities)
  - [1. Research Studio (Overleaf-Grade LaTeX Workspace)](#1-research-studio-overleaf-grade-latex-workspace)
  - [2. Writer Desk (Industrial Book Production & 3D Mockup)](#2-writer-desk-industrial-book-production--3d-mockup)
  - [3. Document Studio (Universal Document Conversion)](#3-document-studio-universal-document-conversion)
  - [4. Image Studio (High-Performance Vector & Raster Processing)](#4-image-studio-high-performance-vector--raster-processing)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started (Local Development)](#-getting-started-local-development)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Production Deployment](#-production-deployment)
  - [Frontend (Netlify)](#frontend-netlify)
  - [Backend (Render + Docker)](#backend-render--docker)
- [REST API Reference](#-rest-api-reference)
- [Contributing](#-contributing)
- [Author & Acknowledgments](#-author--acknowledgments)

---

## 🌟 Overview

**GranthAstraX** (ग्रंथास्त्र) is an all-in-one desktop-class publishing engineering platform built for researchers, authors, publishers, and developers. It merges the visual intuitiveness of modern WYSIWYG editors with the mathematical rigor of LaTeX typesetting, vector template generation, GS1 Bookland barcode encoding, and photorealistic 3D book cover simulation.

Whether you are authoring a peer-reviewed research paper, preparing a camera-ready book cover for Amazon KDP or IngramSpark, converting legacy DOCX files to clean PDF/Markdown, or optimizing media assets, GranthAstraX provides a streamlined, zero-friction workstation.

---

## 🚀 Core Studios & Capabilities

### 1. Research Studio (Overleaf-Grade LaTeX Workspace)

A dual-engine academic authoring environment that eliminates the friction of writing raw LaTeX while preserving 100% syntactic precision.

- **Dual-Pane Synchronized Workflow**: Rich-text WYSIWYG editor (TipTap) on the left, synchronized live with a syntax-highlighted LaTeX source editor (CodeMirror) on the right.
- **AST-Driven Transpiler**: Converts visual formatting (headings, tables, mathematical equations, bold/italic, lists, blockquotes) into clean, standard LaTeX syntax in real time.
- **On-Demand Tectonic LaTeX Compilation**: Powered by a Rust-based, containerized Tectonic engine on the backend that fetches required TeX packages on the fly and renders publication-ready PDF documents without massive local TeXLive installations.
- **Auxiliary File & Citation Support**: Manage multi-file projects including `.bib` BibTeX bibliographies, custom `.sty` stylesheets, and supplementary `.tex` documents.
- **Cloud Asset Management**: Seamless image uploads via Cloudinary with automatic generation of LaTeX figure code (`\begin{figure}[h] ... \includegraphics{...}`).
- **One-Click Source Archive (ZIP)**: Download the entire project bundle (`main.tex`, auxiliary files, images, and compiled PDF) ready for arXiv or journal submission.
- **Cloud Project Persistence**: Autosave and sync across sessions with Firebase Authentication and MongoDB.

---

### 2. Writer Desk (Industrial Book Production & 3D Mockup)

A specialized workstation for print book manufacturing, cover blueprint generation, and retail verification.

- **Trim Size Engineering**:
  - Industry presets: **Mass Market Paperback** (4.19" × 6.87"), **Trade Paperback US** (6" × 9"), **A5** (5.83" × 8.27"), **Royal** (6.14" × 9.21"), **Demy** (5.51" × 8.58"), and **Square** (7.5" × 7.5").
  - **Custom Dimensions**: Input custom trim width and height with automatic conversion across `mm`, `in`, and `cm`.
- **Physical Spine Width Auto-Calculation**:
  - Accurately computes exact spine thickness based on paper stock caliper: **50 GSM, 70 GSM, 80 GSM, 100 GSM, 120 GSM**, page count, and binding format.
  - Adds standard **+6 mm** board casing allowance for hardcovers.
- **2D Wraparound Blueprint Generator**:
  - Generates full wraparound cover dimensions (`Back Cover + Spine + Front Cover + Outer Bleed`).
  - Exports production-grade vector **Cover Template PDFs** with 3 mm bleed lines, 5 mm safe zones, spine boundary fold guides, and specification legends.
- **GS1 / BISG Official Bookland EAN Barcode Generator**:
  - Generates retail-compliant **EAN-13 + EAN-5 price supplement barcodes** using `bwip-js`.
  - Automatically calculates correct check digits to guarantee 100% barcode readability.
  - Strictly adheres to GS1 Bookland standards for official 5-digit price add-ons:
    - `5` — **USD** ($)
    - `6` — **CAD** (C$)
    - `9` — **GBP** (£)
    - `1` — **EUR** (€)
    - `3` — **AUD** (A$)
    - `4` — **NZD** (NZ$)
- **Interactive 3D Book Mockup & Lamination Studio**:
  - Built with **Three.js** and **OrbitControls** (rotate, pan, zoom).
  - **PBR Cover Lamination Simulation**:
    - **Glossy Finish**: High-sheen clearcoat (`MeshPhysicalMaterial`) with dynamic specular light gleams as the book is rotated.
    - **Matte Finish**: Soft-touch, velvety, diffuse, non-glare paper surface.
  - **Intelligent Bleed Chopping**: Direct GPU UV buffer slicing that cuts off outer template margins/guides so only the live trimmed cover wraps the book, with an interactive slider (`1 mm` to `20 mm`) and presets (`3 mm`, `6 mm`, `10 mm`, `15 mm`).

---

### 3. Document Studio (Universal Document Conversion)

A client-and-server document processing utility:

- **Cross-Format Conversion**: Convert between `DOCX`, `PDF`, `HTML`, `Markdown`, and plain `TXT`.
- **Document Optimization & Compression**: Reduce file sizes for sharing or archival using `pdf-lib` and `mammoth`.
- **Instant Client-Side & Backend Processing**: Drag-and-drop batch processing with tabular conversion status.

---

### 4. Image Studio (High-Performance Vector & Raster Processing)

A media engineering utility powered by Libvips:

- **Format Transcoding**: High-speed conversion between `PNG`, `JPEG`, `WebP`, `AVIF`, `TIFF`, and `PDF`.
- **Raster-to-Vector Tracing**: Convert bitmap images to scalable vector graphics (`SVG`) via `imagetracerjs`.
- **Lossless & Lossy Compression**: Fine-tune compression levels, dimensions, and quality presets for web delivery or print resolution (300 DPI).

---

## 🏗 System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Tier (Netlify)"]
        UI["GranthAstraX React 19 Frontend\n(TanStack Router + Tailwind CSS v4)"]
        ThreeJS["Three.js 3D Viewer\n(PBR Materials & Dynamic UV Slicing)"]
        Editor["TipTap WYSIWYG + CodeMirror LaTeX"]
    end

    subgraph CloudServices["Managed Cloud Services"]
        FirebaseAuth["Firebase Authentication\n(JWT / Auth State)"]
        Cloudinary["Cloudinary CDN\n(Image & Asset Storage)"]
        MongoDBAtlas["MongoDB Atlas\n(Project & Document Metadata)"]
    end

    subgraph BackendTier["Backend Microservice Tier (Render + Docker)"]
        ExpressApp["Express.js Server\n(Node.js 20)"]
        Tectonic["Tectonic LaTeX Engine\n(Rust-based Standalone Typesetter)"]
        SharpLib["Sharp (Libvips)\n(Image Processing & Compression)"]
        PDFKitEngine["PDFKit & BWIP-JS\n(Templates & Barcode Generation)"]
        PuppeteerEngine["Puppeteer (Headless Chromium)\n(HTML-to-PDF Document Conversion)"]
    end

    UI <-->|Auth Tokens| FirebaseAuth
    UI <-->|Direct Uploads| Cloudinary
    UI <-->|REST API / JSON| ExpressApp
    ThreeJS -.->|Render Texture| UI
    Editor -.->|Real-time AST| UI

    ExpressApp <-->|Mongoose Models| MongoDBAtlas
    ExpressApp -->|Typesetting| Tectonic
    ExpressApp -->|Image Pipeline| SharpLib
    ExpressApp -->|Vector PDF & Barcode| PDFKitEngine
    ExpressApp -->|Document Engine| PuppeteerEngine
```

---

## 💻 Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) | Latest React concurrent architecture |
| **Routing & State** | [TanStack Router](https://tanstack.com/router) & [React Query](https://tanstack.com/query) | Type-safe client-side routing & cache |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/) | Themeable, accessible luxury design system |
| **3D Graphics** | [Three.js](https://threejs.org/) | WebGL physically-based book rendering |
| **Rich Text & Code** | [TipTap](https://tiptap.dev/) & [CodeMirror 6](https://codemirror.net/) | WYSIWYG editor and syntax-highlighted LaTeX |
| **Backend Runtime** | [Node.js 20](https://nodejs.org/) & [Express 5](https://expressjs.com/) | RESTful API server |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) | User project schemas & metadata storage |
| **LaTeX Engine** | [Tectonic](https://tectonic-typesetting.github.io/) | Rust-powered self-contained TeX compiler |
| **Image Processing** | [Sharp](https://sharp.pixelplumbing.com/) (Libvips) | Ultra-fast image resizing & transcoding |
| **PDF Generation** | [PDFKit](https://pdfkit.org/) & [pdf-lib](https://pdf-lib.js.org/) | Vector print cover template generation |
| **Barcodes** | [bwip-js](https://github.com/metafloor/bwip-js) | GS1 Bookland EAN-13 + EAN-5 barcodes |
| **Containerization** | [Docker](https://www.docker.com/) | Reproducible backend environment |
| **Deployment** | [Netlify](https://www.netlify.com/) & [Render](https://render.com/) | Edge frontend & containerized cloud service |

---

## 🛠 Getting Started (Local Development)

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v20.x` or higher ([Download Node.js](https://nodejs.org/))
- **npm** or **bun**
- **Git**

*(Optional for local LaTeX compiling)*: **Docker** or **Tectonic CLI**.

---

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Bangadhipati/granthastrax.git
   cd granthastrax
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   cd ..
   ```

---

### Environment Variables

#### 1. Frontend (`.env` in root)
Create a `.env` file in the root directory:
```env
VITE_BACKEND_URL="http://localhost:5000"

# Firebase Authentication
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"

# Cloudinary (for Research Workspace figure uploads)
VITE_CLOUDINARY_CLOUD_NAME="your-cloud-name"
VITE_CLOUDINARY_UPLOAD_PRESET="your-upload-preset"
```

#### 2. Backend (`backend/.env`)
Create a `.env` file inside the `backend/` folder:
```env
PORT=5000
MONGODB_URI="your-mongodb-connection-string"
```

---

### Running the App

You can start both frontend and backend concurrently from the project root:

```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`

Alternatively, you can run them separately in distinct terminals:
```bash
# Terminal 1: Frontend
npm run dev:frontend

# Terminal 2: Backend
npm run dev:backend
```

---

## 🚢 Production Deployment

### Frontend (Netlify)
The frontend is pre-configured for Netlify deployment via `netlify.toml`:
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**: Set `VITE_BACKEND_URL` to your live backend endpoint (e.g., `https://granthastrax.onrender.com`).

Live Deployment: [https://granthastrax.netlify.app/](https://granthastrax.netlify.app/)

---

### Backend (Render + Docker)
The backend includes a production-grade multi-stage `Dockerfile` based on `node:20-bookworm-slim` that installs:
- Tectonic LaTeX engine binary
- Fontconfig and modern OpenType/TrueType fonts
- Chromium dependencies for Puppeteer
- Libvips for Sharp image processing

To deploy on Render:
1. Connect the `Bangadhipati/granthastrax` GitHub repository.
2. Select **Web Service** with **Environment: Docker**.
3. Set **Root Directory**: `backend`.
4. Configure environment variables (`PORT=10000`, `MONGODB_URI`).

Live API: [https://granthastrax.onrender.com/](https://granthastrax.onrender.com/)

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health verification endpoint |
| `POST` | `/api/compile` | Compiles LaTeX source code into PDF via Tectonic engine |
| `POST` | `/api/compile/export` | Packages `.tex`, `.bib`, assets, and PDF into a downloadable ZIP archive |
| `GET` | `/api/writer-desk/spine` | Calculates exact spine thickness in mm from page count and GSM |
| `POST` | `/api/writer-desk/template` | Generates a print-ready vector PDF cover template with bleed guides |
| `POST` | `/api/writer-desk/barcode` | Generates a GS1 Bookland EAN-13 + EAN-5 barcode PNG buffer |
| `POST` | `/api/image-studio/convert` | Transcodes, resizes, and optimizes raster/vector images |
| `POST` | `/api/doc-studio/convert` | Converts documents across PDF, DOCX, Markdown, and HTML formats |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository ([https://github.com/Bangadhipati/granthastrax](https://github.com/Bangadhipati/granthastrax))
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author & Acknowledgments

- **Lead Developer**: **Debarghya Bhowmick** ([@Bangadhipati](https://github.com/Bangadhipati))
- **Repository**: [https://github.com/Bangadhipati/granthastrax](https://github.com/Bangadhipati/granthastrax)
- **Live Demo**: [GranthAstraX Studio](https://granthastrax.netlify.app/)

---

<div align="center">
  <sub>Crafted with passion for typography, science, and publishing engineering. © 2026 GranthAstraX.</sub>
</div>
