import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "online", 
      timestamp: new Date().toISOString(),
      platform: "Node.js (Express)"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("🚀 Vite development middleware active");
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("📦 Production static assets loaded");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n📡 Platform Server Initialized`);
    console.log(`🔗 Local Interface: http://0.0.0.0:${PORT}`);
    console.log(`🛠️ Mode: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer().catch((err) => {
  console.error("Critical server failure:", err);
  process.exit(1);
});
