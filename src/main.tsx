import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const redirectPath = sessionStorage.getItem("buyernodus:redirect-path");

if (redirectPath) {
  sessionStorage.removeItem("buyernodus:redirect-path");
  window.history.replaceState(null, "", redirectPath);
}

createRoot(document.getElementById("root")!).render(<App />);
