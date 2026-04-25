const walletModel = require("../models/walletModel.js");

function devDetails(error) {
  if (process.env.NODE_ENV === "production") return null;
  return { message: error?.message || "Unknown error", code: error?.code || null };
}

async function summary(req, res) {
  const userId = req.query?.userId;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const summary = await walletModel.getWalletSummary({ userId });
    return res.json({ ok: true, summary });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

async function transactions(req, res) {
  const userId = req.query?.userId;
  const transactionType = req.query?.type || null;
  const limit = req.query?.limit || null;
  if (!userId) return res.status(400).json({ ok: false, error: "userId is required" });

  try {
    const transactions = await walletModel.listTransactions({ userId, transactionType, limit });
    return res.json({ ok: true, transactions });
  } catch (error) {
    console.log(error.message);
    const details = devDetails(error);
    return res.status(500).json({ ok: false, error: "Error", details });
  }
}

module.exports = {
  summary,
  transactions,
};

