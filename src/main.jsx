import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ChatProvider } from "./hooks/useChat";
import { AvatarProvider } from "./hooks/useAvatar";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChatProvider>
      <AvatarProvider>
          <BrowserRouter>
              <App />
            </BrowserRouter>
      </AvatarProvider>
    </ChatProvider>
	</React.StrictMode>
);