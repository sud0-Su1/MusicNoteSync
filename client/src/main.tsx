import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { useEffect, useState } from "react";

// Import Remix icons via CDN
function RemixIconsScript() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      const link = document.createElement("link");
      link.href = "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css";
      link.rel = "stylesheet";
      document.head.appendChild(link);
      
      // Set title
      document.title = "Notes & Vibes | Note Taking App with Music";
      
      setLoaded(true);
    }
  }, [loaded]);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <>
    <RemixIconsScript />
    <App />
  </>
);
