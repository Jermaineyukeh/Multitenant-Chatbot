require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

require("./db"); // ensures tables are created on boot

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const whatsappRoutes = require("./routes/whatsapp");
const instagramRoutes = require("./routes/instagram");
const { router: authRoutes } = require("./routes/auth");
const adminRoutes = require("./routes/admin");

app.use("/whatsapp", whatsappRoutes);
app.use("/instagram", instagramRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Multi-tenant chatbot server running on port ${PORT}`);
});
