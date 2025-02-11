import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ChatProvider } from "./hooks/useChat";
import { AvatarProvider } from "./hooks/useAvatar";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ChatProvider>
        <AvatarProvider>
          <App />
        </AvatarProvider>
      </ChatProvider>
    </BrowserRouter>
  </React.StrictMode>
);