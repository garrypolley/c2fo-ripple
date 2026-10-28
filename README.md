# C2FO–Ripple on the public ledger

Unofficial page about the 27 October 2026 [C2FO and Ripple announcement](https://ripple.com/ripple-press/c2fo-and-ripple-partner-to-modernize-trade-finance-using-the-xrp-ledger/). It reads the public RLUSD issuer on the XRP Ledger. It does not attribute payments to C2FO Instant Pay.

The issuer is `rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`. Outstanding RLUSD is that account’s `gateway_balances` obligation. The live tape is successful payments between two different accounts delivering at least 100 RLUSD. Offers and self-payments stay off the tape.

Open `index.html` in a browser, or serve this folder:

```
python3 -m http.server 8788
```

Deploy the folder as a static Netlify site. Intended hostname: `c2fo-ripple.garrypolley.com`.
