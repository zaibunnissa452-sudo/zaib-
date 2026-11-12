import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { PhotographySite } from "./pages/PhotographySite";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PhotographySite />
  </StrictMode>,
);
