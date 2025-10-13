# Black Swan

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

[Website](https://blackswan.wtf) • [Documentation](https://blackswanwtf.gitbook.io/docs) • [Farcaster](https://farcaster.xyz/blackswanwtf)

</div>

## 🎯 Overview

Black Swan is a team of AI Agents working 24/7 analyse your tokens, the market and global events to ensure you sell before everyone else. Think of it as your dedicated team of experts working 24/7 to keep you informed.

Black Swan is open source and a public good built to help you win on the daily in crypto and help you maximise your returns.

## 🛠 Tech Stack

### **Frontend**

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Component Library**: [shadcn/ui](https://ui.shadcn.com/) with Radix UI primitives
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: React Context + [TanStack Query](https://tanstack.com/query)

### **Web3**

- **Wallet Connection**: [Reown AppKit](https://reown.com/) (formerly WalletConnect)
- **Blockchain Interaction**: [Wagmi](https://wagmi.sh/) + [Viem](https://viem.sh/)
- **Authentication**: [SIWE](https://login.xyz/) (Sign-In with Ethereum)
- **Coinbase Integration**: [OnchainKit](https://onchainkit.xyz/)
- **Farcaster**: [@farcaster/auth-kit](https://docs.farcaster.xyz/auth-kit/installation)

### **Backend & Services**

- **Database**: [Firebase](https://firebase.google.com/) (Firestore)
- **Authentication**: Firebase Auth + Custom Auth Service
- **API**: Next.js API Routes + External Platform API
- **Real-time**: Server-Sent Events (SSE)

### **Additional Tools**

- **Form Management**: React Hook Form + Zod validation
- **Date Handling**: date-fns
- **Markdown**: react-markdown
- **Icons**: Lucide React + React Icons
- **Theme**: next-themes (Dark mode support)
- **Notifications**: Sonner (Toast notifications)

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.17 or higher ([Download](https://nodejs.org/))
- **npm**: v9 or higher (comes with Node.js)
- **Git**: ([Download](https://git-scm.com/))

### Optional

- A Web3 wallet (MetaMask, Coinbase Wallet, etc.) for testing
- Firebase project for backend services
- Access to the Black Swan Platform API

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/blackswan-webapp.git
cd blackswan-webapp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory and add your environment variables (see [Environment Variables](#environment-variables) section below).

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🔐 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# ============================================
# Firebase Configuration
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# ============================================
# Reown (WalletConnect) Configuration
# ============================================
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id

# ============================================
# Coinbase OnchainKit
# ============================================
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key

# ============================================
# Telegram Configuration
# ============================================
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
NEXT_PUBLIC_TELEGRAM_BOT_ID=your_bot_id

# ============================================
# Farcaster Configuration
# ============================================
NEXT_PUBLIC_FARCASTER_CLIENT_ID=your_farcaster_client_id

# ============================================
# Backend Services (Optional - use defaults if not set)
# ============================================
NEXT_PUBLIC_NOTIFICATIONS_SERVICE_URL=http://localhost:8085
NEXT_PUBLIC_USER_AUTH_SERVICE_URL=https://your-user-auth-service.azurewebsites.net
NEXT_PUBLIC_PLATFORM_API_URL=https://your-platform-api.azurewebsites.net
NEXT_PUBLIC_POINTS_API_URL=https://your-points-service.azurewebsites.net

# ============================================
# Feature Flags (Optional)
# ============================================
NEXT_PUBLIC_ENABLE_TELEGRAM_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_WEBAPP_NOTIFICATIONS=true
NEXT_PUBLIC_TOKEN_SERVICE_PAUSED=false
```

## 🏗 Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────────┐
│                   Next.js App                   │
│  ┌───────────────────────────────────────────┐  │
│  │           Root Layout (app/layout.tsx)    │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Providers (Auth, Wagmi, Theme...)  │  │  │
│  │  │  ┌───────────────────────────────┐  │  │  │
│  │  │  │   SidebarProvider             │  │  │  │
│  │  │  │  ┌─────────────────────────┐  │  │  │  │
│  │  │  │  │  Page Routes (swan,     │  │  │  │  │
│  │  │  │  │  peak, funds, tokens)   │  │  │  │  │
│  │  │  │  └─────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication**: User connects wallet → SIWE signature → Firebase token → Protected routes
2. **Real-time Updates**: SSE connection → Context → Component re-render
3. **API Calls**: Component → Custom Hook → Next.js API Route → External Service
4. **State Management**: TanStack Query for server state + React Context for global state

### Key Design Patterns

- **Server-Side Rendering (SSR)**: Pages are pre-rendered for SEO and performance
- **API Route Proxy**: Next.js API routes proxy requests to backend services
- **Custom Hooks**: Encapsulate data fetching and business logic
- **Context Providers**: Manage global state (auth, theme, notifications)
- **Component Composition**: shadcn/ui components for consistent UI

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and ensure they follow the code style
4. **Test thoroughly** - make sure nothing breaks
5. **Commit your changes**: `git commit -m 'feat: add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Development Guidelines

- Write **clean, readable code** with proper TypeScript types
- Follow **existing patterns** and conventions
- Add **comments** for complex logic
- Keep **components small and focused**
- Use **custom hooks** for reusable logic
- Ensure **responsive design** works on mobile
