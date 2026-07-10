# Next.js Multi-Panel Application

> A production-grade, multi-role dashboard system built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4 — featuring role-based panels, real-time data, payment integration, and enterprise UI components.

## 🎯 Project Overview

A comprehensive multi-panel web application designed for organizations that need **separate user experiences** for different roles (Admin, Citizen) within a single unified codebase. Built with modern Next.js App Router architecture and optimized for scalability.

## ✨ Key Features

### 🔐 Multi-Role Panel System
- **Admin Panel** (`/(admin)/admin-panel`) — Full administrative dashboard with user management, analytics, and system controls
- **Citizen Dashboard** (`/(citizen)/dashboard`) — Public-facing dashboard for end users with personalized views
- **Authentication Flow** (`/(auth)`) — Secure login/registration with role-based routing

### 💳 Payment Integration
- **Stripe Payment Gateway** — Full integration with `@stripe/react-stripe-js` and `@stripe/stripe-js`
- Secure payment processing for subscriptions and transactions

### 📊 Data Visualization & Analytics
- **Chart.js** with `react-chartjs-2` — Interactive charts for dashboards
- **PrimeReact** components — Enterprise-grade UI components with `primeicons`
- Real-time data display with responsive layouts

### 📝 Rich Text & Content Management
- **React Quill New** — WYSIWYG rich text editor for content creation
- **Date-fns** — Date formatting and manipulation utilities

### 🎨 Drag & Drop Functionality
- **@dnd-kit** — Modern drag-and-drop toolkit for sortable lists and interactive UI elements
- Smooth animations and accessible drag interactions

### 🔥 Real-time Features
- **Firebase Integration** — Real-time database, authentication, and cloud services
- Live data synchronization across panels

### 🌓 Theme System
- **next-themes** — Dark/light mode with system preference detection
- Seamless theme switching with persistence

### 🎯 State Management
- **React Context API** — Global state management via `app/contexts`
- **Custom Hooks** — Reusable logic in `app/hooks`
- **Helper Utilities** — Shared functions in `app/helpers`

### 🏗 Architecture Highlights
- **Higher-Order Components (HOC)** — Reusable component logic in `app/hoc`
- **Library/Utilities** — Core utilities in `app/lib`
- **Component-Driven Design** — Modular, reusable components in `app/components`
- **TypeScript-First** — Full type safety across the entire codebase

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.1.6 (App Router) |
| **Frontend** | React 19.2.3 |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS v4, Sass |
| **UI Components** | PrimeReact 10.9.7, Heroicons 2.2.0 |
| **Charts** | Chart.js 4.5.1, react-chartjs-2 5.3.1 |
| **Payments** | Stripe (react-stripe-js 5.6.0) |
| **Real-time** | Firebase 12.9.0 |
| **Drag & Drop** | @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0 |
| **Rich Text** | react-quill-new 3.8.3 |
| **Theme** | next-themes 0.4.6 |
| **Utilities** | date-fns 4.1.0, js-cookie 3.0.5 |
| **Package Manager** | pnpm 10.21.0 |

## 📁 Project Structure

```
nextJs-multi-panel/
├── app/
│   ├── (admin)/
│   │   └── admin-panel/          # Admin dashboard & management
│   ├── (auth)/                   # Authentication routes
│   ├── (citizen)/
│   │   └── dashboard/            # Citizen user dashboard
│   ├── assets/css/               # Global stylesheets
│   ├── components/               # Reusable UI components
│   ├── contexts/                 # React Context providers
│   ├── helpers/                  # Utility functions
│   ├── hoc/                      # Higher-Order Components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Core libraries & utilities
│   ├── styles/                   # Component-specific styles
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Global CSS
│   └── primereact-provider.tsx   # PrimeReact context wrapper
├── public/                       # Static assets
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (recommended: 20+)
- pnpm 10.21.0+

### Installation

```bash
# Clone the repository
git clone https://github.com/Yousuf59zaman/nextJs-multi-panel.git
cd nextJs-multi-panel

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server with hot reload

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
```

## 🏗 Architecture Decisions

### Why Next.js App Router?
- **Server Components** by default for better performance
- **Route Groups** `()` for logical organization without URL impact
- **Layouts** for shared UI across routes
- **Streaming** for progressive page loading

### Why pnpm?
- **Faster installs** — Hard links instead of copies
- **Disk efficient** — Shared dependency store
- **Strict mode** — Prevents phantom dependencies

### Component Architecture
- **Atomic Design** — Small, focused components
- **Composition over Inheritance** — Flexible component patterns
- **TypeScript Interfaces** — Clear component contracts

## 🎯 Use Cases

This project demonstrates expertise in:
- ✅ **Multi-tenant applications** — Role-based UI/UX
- ✅ **Enterprise dashboards** — Complex data visualization
- ✅ **E-commerce platforms** — Payment integration
- ✅ **SaaS products** — Subscription management
- ✅ **Real-time applications** — Firebase integration
- ✅ **Accessible UI** — ARIA-compliant components

## 🔒 Security Features

- **Environment Variables** — Secure configuration management
- **Stripe Security** — PCI-compliant payment processing
- **Firebase Auth** — Industry-standard authentication
- **TypeScript** — Compile-time error prevention
- **Input Validation** — Client and server-side validation

## 📊 Performance Optimizations

- **Next.js Image Optimization** — Automatic image compression
- **Font Optimization** — `next/font` for Google Fonts
- **Code Splitting** — Automatic route-based splitting
- **Static Generation** — SSG for marketing pages
- **Server Components** — Reduced client-side JavaScript

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms
- **Netlify** — `netlify deploy`
- **AWS Amplify** — Connect GitHub repo
- **Docker** — Custom Dockerfile

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Yousuf Zaman**
- GitHub: [@Yousuf59zaman](https://github.com/Yousuf59zaman)
- LinkedIn: [Md Yousuf Zaman](https://www.linkedin.com/in/md-yousuf-zaman-8596812a8/)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) — The React Framework
- [Vercel](https://vercel.com) — Deployment platform
- [PrimeReact](https://primereact.org) — UI component library
- [Stripe](https://stripe.com) — Payment infrastructure
- [Firebase](https://firebase.google.com) — Backend-as-a-Service

---

<div align="center">

**Built with ❤️ using Next.js 16, React 19, and TypeScript**

[⭐ Star this repo](https://github.com/Yousuf59zaman/nextJs-multi-panel/stargazers) if you found it helpful!

</div>