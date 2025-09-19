// functions/xion.js
import dotenv from "dotenv";
dotenv.config();

import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";

const RPC = process.env.XION_RPC || "https://rpc.xion-testnet-1.burnt.com:443";
const PREFIX = process.env.XION_PREFIX || "xion";

// helper: connect wallet (service wallet MNEMONIC stored in .env)
export async function connectWallet() {
  if (!process.env.MNEMONIC) throw new Error("MNEMONIC not set in .env");
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(process.env.MNEMONIC, {
    prefix: PREFIX,
  });
  const [account] = await wallet.getAccounts();
  const client = await SigningStargateClient.connectWithSigner(RPC, wallet);
  return { client, account };
}

/**
 * Create alias on-chain (dummy self-transfer with memo alias:ID)
 * returns simplified object: { alias, txHash, memo }
 */
export async function createAlias(aliasId) {
  const { client, account } = await connectWallet();

  const finalAlias = aliasId && String(aliasId).trim() ? String(aliasId).trim() : null;
  if (!finalAlias) throw new Error("aliasId required");

  const msg = {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    value: {
      fromAddress: account.address,
      toAddress: account.address,
      amount: [{ denom: "uxion", amount: "1" }],
    },
  };

  const memo = `alias:${finalAlias}`;
  const fee = { amount: [{ denom: "uxion", amount: "200" }], gas: "200000" };

  const result = await client.signAndBroadcast(account.address, [msg], fee, memo);

  // normalize minimal fields to avoid BigInt / complex types
  return {
    alias: finalAlias,
    txHash: result.transactionHash ? String(result.transactionHash) : null,
    memo,
  };
}

/**
 * Confirm alias on-chain: broadcasts tx with memo confirm:FROM->TO
 * returns { from, to, txHash, memo }
 */
export async function confirmAlias(fromAlias, toAlias) {
  if (!fromAlias || !toAlias) throw new Error("fromAlias and toAlias required");

  const { client, account } = await connectWallet();

  // dummy transfer message signed by service wallet
  const msg = {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    value: {
      fromAddress: account.address,
      toAddress: account.address,
      amount: [{ denom: "uxion", amount: "1" }],
    },
  };

  const memo = `confirm:${fromAlias}->${toAlias}`;

  // simple fixed fee (untested). In production consider client.simulate() & dynamic gas
  const fee = { amount: [{ denom: "uxion", amount: "200" }], gas: "200000" };

  const result = await client.signAndBroadcast(account.address, [msg], fee, memo);

  return {
    from: String(fromAlias),
    to: String(toAlias),
    txHash: result.transactionHash ? String(result.transactionHash) : null,
    memo,
  };
}