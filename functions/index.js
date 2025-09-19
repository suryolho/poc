// functions/index.js
import functions from "firebase-functions";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { createAlias, confirmAlias } from "./xion.js";

// safe global toJSON for BigInt (helps if any BigInt sneaks through)
if (typeof BigInt !== "undefined" && !BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// POST /alias
// body: { "aliasId": "demo01" }
// returns { success: true, alias, txHash, memo }
app.post("/alias", async (req, res) => {
  try {
    const { aliasId } = req.body;
    if (!aliasId) return res.status(400).json({ error: "aliasId required" });

    const tx = await createAlias(aliasId);
    return res.json({ success: true, alias: tx.alias, txHash: tx.txHash, memo: tx.memo });
  } catch (err) {
    console.error("POST /alias error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /confirm
// body: { "fromAlias": "demo01", "toAlias": "demo02" }
// returns { success: true, from, to, txHash, memo }
app.post("/confirm", async (req, res) => {
  try {
    const { fromAlias, toAlias } = req.body;
    if (!fromAlias || !toAlias) return res.status(400).json({ error: "fromAlias and toAlias required" });

    const tx = await confirmAlias(fromAlias, toAlias);
    return res.json({ success: true, from: tx.from, to: tx.to, txHash: tx.txHash, memo: tx.memo });
  } catch (err) {
    console.error("POST /confirm error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// simple health
app.get("/", (req, res) => res.send("Alias backend (confirm on-chain) running ✅"));

export const api = functions.https.onRequest(app);