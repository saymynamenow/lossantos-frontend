// Polyfill for Draft.js
if (typeof (globalThis as any).global === "undefined") {
  (globalThis as any).global = globalThis;
}

import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { Theme } from "@radix-ui/themes";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./hooks/authContext.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Theme appearance="dark">
      <AuthProvider>
        <App />
      </AuthProvider>
    </Theme>
  </BrowserRouter>
);
