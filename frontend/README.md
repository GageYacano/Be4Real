# Be4Real Frontend

Single-page React application for Be4Real.

## Structure

```
frontend/
├── src/
│   ├── pages/           # Page components (LoginPage, RegisterPage, HomePage, ProfilePage)
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Shadcn/Radix UI components
│   │   ├── figma/       # Custom components (ImageWithFallback, etc.)
│   │   ├── PostCard.tsx
│   │   └── UserProfileSheet.tsx
│   ├── styles/          # Global styles
│   ├── App.tsx          # Main app with routing logic
│   └── main.tsx         # Entry point
├── index.html
├── vite.config.ts
└── package.json
```

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Build for Production

```bash
npm run build
```

Outputs to `../web/` which is served by the backend.

## API Proxy

Dev server proxies `/api/*` to `http://localhost:3000` (make sure backend is running).
