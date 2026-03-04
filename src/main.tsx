import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./utils/apiTest.ts"; // Load API test utilities for console testing

createRoot(document.getElementById("root")!).render(<App />);
