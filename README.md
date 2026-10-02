# Booklet Generator

A web application built with React, Vite, and Tailwind CSS for designing, customizing, and generating print-ready booklets and event programs.

It features a visual editor for pages and block layers, customizable themes, live page spread previews, and automatic saddle-stitch print imposition for standard double-sided folded printing.

---

## 🌟 Key Features

- **Visual Page & Block Layer Editor**:
  - Create, reorder, delete, and duplicate booklet pages.
  - Add and customize content blocks: Titles, Headers, Subheaders, Body Text, Bullet Lists, Columns, Callout Boxes, Images, and Footers.
  - Fine-tune block alignment, font sizes, colors, and styling through intuitive form controls.
- **Dynamic Theme Editor**:
  - Customize color palettes (Background Cream, Dark Navy, Teal Accent, Charcoal Text).
  - Adjust title and body font families.
  - Set global page dimensions and margin offsets.
  - Toggle decorative headers, footers, and page numbers.
- **Interactive Booklet Reader (Page Spreads)**:
  - Preview booklet pages side-by-side as two-page spreads exactly as a reader sees them.
  - Page navigation controls with quick jumping and cover page handling.
- **Saddle-Stitch Print Imposition**:
  - Calculates front/back sheet arrangements for 11 × 8.5 inch folded booklet printing (e.g. Sheet 1 Front: Page 8 & Page 1; Sheet 1 Back: Page 2 & Page 7).
  - Clean print styles optimized for double-sided paper output (`Ctrl+P` / `Cmd+P`).
- **Preset System & JSON Import/Export**:
  - Quick-start presets including Blank Booklet, Generic Event Program, and Order of the Arrow 75th Anniversary Program.
  - Export full booklet configuration state to JSON for backup or sharing.
  - Import existing JSON booklet state with error validation.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [PostCSS](https://postcss.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linting**: ESLint

---

## 📁 Project Architecture

```
booklet-generator/
├── index.html               # Main HTML entry point
├── package.json             # Dependencies and npm scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── prgram_generator.html    # Legacy standalone generator reference
└── src/
    ├── main.jsx             # React entry point
    ├── App.jsx              # Main layout & view mode toggle
    ├── index.css            # Global CSS styles & CSS custom variables
    ├── components/
    │   ├── Header.jsx           # Top navbar with title, import/export & presets
    │   ├── Sidebar.jsx          # Accordion navigation for editors
    │   ├── ThemeEditor.jsx      # Form controls for theme & global layout
    │   ├── PageCardEditor.jsx   # List of pages with reordering & block editor trigger
    │   ├── BlockLayerEditor.jsx # Modal editor for individual page content blocks
    │   ├── PageRenderer.jsx     # Pure rendering component for a single booklet page
    │   ├── SpreadViewer.jsx     # Reader view (2-page side-by-side spreads)
    │   └── ImpositionViewer.jsx # Print view (Saddle-stitch folded sheet layout)
    ├── context/
    │   ├── BookletContext.jsx   # React Context provider & hooks
    │   └── bookletReducer.js    # Pure reducer managing booklet state actions
    ├── presets/
    │   ├── index.js             # Preset loader registry
    │   ├── blank.js             # Blank starter template
    │   ├── generic.js           # Generic booklet template
    │   └── oa75th.js            # Order of the Arrow 75th Anniversary program preset
    └── utils/
        └── imposition.js        # Saddle-stitch page pairing algorithm
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v16+ recommended) and `npm` installed.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd booklet-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## 📜 Available Scripts

In the project directory, you can run:

- **`npm run dev`**: Starts the Vite development server.
- **`npm run build`**: Builds the production bundle in the `dist/` directory.
- **`npm run preview`**: Serves the built production dist directory locally.
- **`npm run lint`**: Runs ESLint across the codebase to check for code quality issues.

---

## 🖨️ Printing Instructions

1. Open the application and design your booklet or select a preset.
2. Switch to **Print Imposition** mode using the viewer toggle in the top control bar.
3. Open your browser's Print dialog (`Ctrl+P` on Windows/Linux or `Cmd+P` on macOS).
4. Configure print settings:
   - **Destination**: Save as PDF or select your color printer.
   - **Layout**: Landscape orientation.
   - **Paper Size**: US Letter (8.5 × 11 inches).
   - **Two-Sided Printing**: Flip on Short Edge.
   - **Margins**: None / Minimal.
   - **Background Graphics**: Enabled.
5. Print, fold down the center spine, and staple along the fold!

---

## 📄 License

This project is private software. All rights reserved.
