import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { router, queryClient } from './routes/index'; // Import both router and queryClient
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";

// Wait for the router to be ready
await router.load();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);