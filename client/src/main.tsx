import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ClerkProvider } from './providers/ClerkProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ClerkProvider>
        <App />
      </ClerkProvider>
    </React.StrictMode>
  );