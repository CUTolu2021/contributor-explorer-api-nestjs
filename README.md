# Angular Contributor Explorer 🚀

An advanced full-stack application that aggregates, ranks, and visualizes contributor data from the entire Angular GitHub organization. This project solves the challenge of visualizing data across 200+ repositories by acting as a high-performance aggregation proxy.

![License](https://img.shields.io/badge/license-MIT-blue)
![Angular](https://img.shields.io/badge/Frontend-Angular%2019-dd0031)
![NestJS](https://img.shields.io/badge/Backend-NestJS-e0234e)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6)

## 📋 Table of Contents
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Screenshots](#-screenshots)

## 🏗 Architecture

This project uses a **BFF (Backend for Frontend)** pattern. The NestJS backend handles the heavy lifting of fetching data from GitHub, handling pagination, aggregating thousands of records, and caching the results to bypass rate limits.



**Data Flow:**
1. Angular requests data.
2. NestJS checks the **In-Memory Cache**.
3. On a cache miss, NestJS initiates a **Recursive Fetch** to GitHub API (handling pagination).
4. Data is aggregated, ranked, and stored in cache.
5. Response is sent to Angular.

## ✨ Key Features

### Backend (NestJS)
* **Smart Aggregation Engine:** Fetches and combines data from over 200+ repositories.
* **Resilient Caching Strategy:** Implements in-memory caching to reduce GitHub API calls by 99% and prevent 403 Rate Limit errors.
* **Security:** Full JWT Authentication flow with Passport strategies and Route Guards.
* **Global Error Handling:** Centralized Exception Filter for consistent JSON error responses.
* **API Documentation:** Fully documented using Swagger/OpenAPI.

### Frontend (Angular 19)
* **Modern Architecture:** Built with Standalone Components and Signal-based concepts.
* **Performance:** Implemented `debounceTime` for search and HTTP Interceptors for auth injection.
* **Robust UX:** Granular handling of loading states, empty states, and specific error codes (401 vs 403).
* **Reactive State:** Uses RxJS `combineLatest` for simultaneous filtering and sorting.

## 🛠 Technology Stack

* **Frontend:** Angular 19, RxJS, CSS3 (Grid/Flexbox)
* **Backend:** NestJS, Passport.js (JWT), Axios, @nestjs/cache-manager
* **External API:** GitHub REST API

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* A GitHub Personal Access Token (PAT)

### 1. Backend Setup
```bash
cd contributor-explorer-api
npm install
Configure Environment: Create a .env file in the api root:

GITHUB_PAT=your_github_token_here
JWT_SECRET=your_complex_secret_key
JWT_EXPIRATION_TIME=3600s

Run Server:

npm run start:dev
# Server runs on http://localhost:3000
# Swagger Docs: http://localhost:3000/api

### 2. Frontend Setup

cd contributor-explorer-ui
npm install
ng serve --open
# App runs on http://localhost:4200