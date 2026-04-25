require("dotenv").config();

const express = require("express");
const cors = require("cors");
const usersModel = require("./models/usersModel.js");
const rootRoutes = require("./routes/rootRoutes.js");
const rolesRoutes = require("./routes/rolesRoutes.js");
const profilesRoutes = require("./routes/profilesRoutes.js");
const skillsRoutes = require("./routes/skillsRoutes.js");
const requestsRoutes = require("./routes/requestsRoutes.js");
const sessionsRoutes = require("./routes/sessionsRoutes.js");
const notificationsRoutes = require("./routes/notificationsRoutes.js");
const messagesRoutes = require("./routes/messagesRoutes.js");
const walletRoutes = require("./routes/walletRoutes.js");
const reviewsRoutes = require("./routes/reviewsRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");

const app = express();

app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    if (req.method === "POST" && req.path === "/create-role") return next();

    const userId =
      req.body?.userId ||
      req.query?.userId ||
      req.params?.userId ||
      req.body?.teacherId ||
      req.body?.learnerId ||
      req.query?.teacherId ||
      req.query?.learnerId ||
      null;

    if (!userId) return next();

    const status = await usersModel.getAccountStatus({ userId });
    if (!status.exists) {
      return res.status(401).json({ ok: false, error: "Account not found.", code: "ACCOUNT_NOT_FOUND" });
    }
    if (status.isSuspended) {
      return res.status(403).json({ ok: false, error: "Account suspended.", code: "ACCOUNT_SUSPENDED" });
    }

    return next();
  } catch (error) {
    console.log(error?.message || error);
    return res.status(500).json({ ok: false, error: "Error" });
  }
});

app.use(rootRoutes);
app.use(rolesRoutes);
app.use(profilesRoutes);
app.use(skillsRoutes);
app.use(requestsRoutes);
app.use(sessionsRoutes);
app.use(notificationsRoutes);
app.use(messagesRoutes);
app.use(walletRoutes);
app.use(reviewsRoutes);
app.use(adminRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
