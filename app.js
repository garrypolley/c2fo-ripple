const ISSUER = "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De";
const CURRENCY = "524C555344000000000000000000000000000000";
const LARGE = 10000;
const MAX_ROWS = 40;
const RIPPLE_EPOCH = Date.UTC(2000, 0, 1);
const CLUSTER = "https://xrplcluster.com";
const SOCKET = "wss://xrplcluster.com";

const outstandingEl = document.querySelector("#outstanding");
const asofEl = document.querySelector("#outstanding-asof");
const statusEl = document.querySelector("#stream-status");
const countsEl = document.querySelector("#stream-counts");
const tapeBody = document.querySelector("#tape-body");

const seen = { listed: 0, large: 0 };
let rows = 0;

function rlUsdAmount(amount) {
  if (!amount || typeof amount !== "object") return null;
  if (amount.currency !== CURRENCY || amount.issuer !== ISSUER) return null;
  const value = Number(amount.value);
  if (!Number.isFinite(value) || value < 0 || value >= 1e15) return null;
  return value;
}

function formatNumber(value) {
  if (value > 0 && value < 0.01) {
    return new Intl.NumberFormat("en-US", { maximumSignificantDigits: 3 }).format(value);
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function shortAccount(account) {
  if (!account || account.length < 12) return account || "";
  return account.slice(0, 6) + "…" + account.slice(-6);
}

function accountLink(account) {
  const a = document.createElement("a");
  a.href = "https://xrpscan.com/account/" + account;
  a.textContent = shortAccount(account);
  a.title = account;
  return a;
}

function memoNote(tx) {
  const memos = Array.isArray(tx.Memos) ? tx.Memos : [];
  if (!memos.length) return "—";
  const parts = [];
  for (const entry of memos) {
    const memo = entry && entry.Memo;
    if (!memo) continue;
    const type = hexToAscii(memo.MemoType);
    const data = hexToAscii(memo.MemoData);
    if (type) parts.push(type);
    else if (memo.MemoData && memo.MemoData.length === 64) parts.push("32-byte memo");
    else if (data) parts.push(data.slice(0, 48));
    else parts.push("memo");
  }
  return parts.join(", ") || "memo";
}

function hexToAscii(hex) {
  if (!hex || hex.length % 2 || hex.length > 128) return "";
  if (!/^[0-9a-fA-F]+$/.test(hex)) return "";
  let text = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    if (code < 32 || code > 126) return "";
    text += String.fromCharCode(code);
  }
  return text;
}

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = "status" + (kind ? " " + kind : "");
}

function renderCounts() {
  countsEl.textContent = seen.listed + " listed · " + seen.large + " of 10,000 RLUSD or more";
}

function addRow(tx, value) {
  if (rows === 0) tapeBody.textContent = "";
  const tr = document.createElement("tr");
  if (value >= LARGE) tr.className = "large";
  const time = document.createElement("td");
  const when = typeof tx.date === "number"
    ? new Date(RIPPLE_EPOCH + tx.date * 1000)
    : new Date();
  time.textContent = when.toISOString().slice(11, 19) + " UTC";
  const amount = document.createElement("td");
  const hashLink = document.createElement("a");
  hashLink.href = "https://xrpscan.com/tx/" + tx.hash;
  hashLink.textContent = formatNumber(value);
  amount.append(hashLink);
  const from = document.createElement("td");
  from.append(accountLink(tx.Account));
  const to = document.createElement("td");
  to.append(accountLink(tx.Destination));
  const note = document.createElement("td");
  note.className = "note";
  const memo = memoNote(tx);
  if (value >= LARGE && memo !== "—") note.textContent = "Large · " + memo;
  else if (value >= LARGE) note.textContent = "Large";
  else note.textContent = memo;
  tr.append(time, amount, from, to, note);
  tapeBody.prepend(tr);
  rows += 1;
  while (tapeBody.rows.length > MAX_ROWS) tapeBody.lastElementChild.remove();
}

function consider(tx, meta, engineResult) {
  if (!tx || tx.TransactionType !== "Payment") return;
  const result = (meta && meta.TransactionResult) || engineResult;
  if (result !== "tesSUCCESS") return;
  if (!tx.Account || tx.Account === tx.Destination) return;
  const value = rlUsdAmount(meta && meta.delivered_amount);
  if (value == null || value === 0) return;
  seen.listed += 1;
  if (value >= LARGE) seen.large += 1;
  addRow(tx, value);
  renderCounts();
}

async function refreshObligation() {
  const body = JSON.stringify({
    method: "gateway_balances",
    params: [{ account: ISSUER, ledger_index: "validated", strict: true }]
  });
  const response = await fetch(CLUSTER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
  if (!response.ok) throw new Error("ledger " + response.status);
  const payload = await response.json();
  const raw = payload.result && payload.result.obligations && payload.result.obligations[CURRENCY];
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error("no obligation");
  outstandingEl.textContent = formatNumber(Math.round(value));
  const ledger = payload.result.ledger_index;
  asofEl.textContent = "Live obligation from xrplcluster.com"
    + (ledger ? ", ledger " + ledger : "")
    + ": " + formatNumber(value) + " RLUSD. The holder count above is an indexer figure from 28 October 2026, not a ledger field.";
}

function connect() {
  let socket;
  try {
    socket = new WebSocket(SOCKET);
  } catch (error) {
    setStatus("The ledger stream did not open in this browser.", "down");
    return;
  }
  socket.addEventListener("open", () => {
    setStatus("Connected. Listing every RLUSD payment between two accounts.", "live");
    socket.send(JSON.stringify({ id: 1, command: "subscribe", streams: ["transactions"] }));
  });
  socket.addEventListener("message", (event) => {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (!message.transaction) return;
    consider(message.transaction, message.meta, message.engine_result);
  });
  socket.addEventListener("close", () => {
    setStatus("The ledger stream closed. Reload the page to listen again.", "down");
  });
  socket.addEventListener("error", () => {
    setStatus("The ledger stream failed.", "down");
  });
}

refreshObligation().catch(() => {
  asofEl.textContent += " A live refresh did not come back; the figure above is the 28 October check.";
});
connect();
