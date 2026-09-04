import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ status: "ok", app: "contoso-webapp" });
});

app.get("/api/health", (req, res) => {
  res.json({ healthy: true, uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`Contoso webapp listening on port ${PORT}`);
});
