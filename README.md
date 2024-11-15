# 3D Model Annotation Tool

## Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Installation and Usage](#installation-and-usage)
- [Demo](#demo)
- [Developer Guide](#developer-guide)
- [Contribution](#contribution)
- [License](#license)
- [Contact Us](#contact-us)

---

## Project Overview
This project is a desktop 3D model annotation tool built with Electron and Three.js, designed for annotating and classifying dental 3D scan models. The tool offers efficient and precise annotation capabilities tailored for industries like dentistry and medical modeling.

---

## Key Features
- **Shortest Path Annotation Algorithm**: Automatically connects selected points on a model to create labeled regions.
- **Spray-Can Style Annotation**: Simulates a spray-paint effect for quick surface annotations.
- **Multi-Mode Annotation**: Supports point, edge, and face annotations.
- **Model Viewing Modes**: Offers multiple view types to improve annotation efficiency.
- **JSON Export**: Exports annotation results in JSON format for further processing.

---

## Tech Stack
- **Electron**: Cross-platform desktop application framework.
- **Three.js**: 3D model rendering and interaction library.
- **TypeScript**: Type-safe programming language for enhanced readability and maintainability.
- **JSON**: Format for storing and exporting annotation data.

---

## Project Structure
CAPSTONE-PROJECT/ ├── node_modules/ ├── src/ │ ├── components/ │ │ ├── Class.tsx # Manages classes and their properties │ │ ├── DetailPane.tsx # Displays detailed annotation information │ │ ├── FilePane.tsx # File selection interface │ │ ├── Header.tsx # Application header │ │ ├── ModelContext.tsx # Context for managing tools and colors │ │ ├── ModelDisplay.tsx # Renders 3D model and handles interactions │ │ ├── Problem.tsx # Handles annotation problem definitions │ │ ├── Sidebar.tsx # Sidebar for tools and options │ │ ├── StateStore.tsx # State management using Zustand │ │ └── UpsertMenu.tsx # Add/Edit menu for annotations │ ├── datatypes/ # Data type definitions │ ├── scripts/ # Core scripts │ ├── style/ # CSS styles │ ├── preload.ts # Preload script for Electron │ └── renderer.ts # Renderer process ├── .eslintrc.json # ESLint configuration ├── forge.config.ts # Electron Forge configuration ├── tsconfig.json # TypeScript configuration └── webpack.*.config.ts # Webpack configurationsconfiguration └── webpack.*.config.ts # Webpack configurations

---

