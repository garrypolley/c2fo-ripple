# C2FO–Ripple on the public ledger

Unofficial page about the 27 October 2026 [C2FO and Ripple announcement](https://ripple.com/ripple-press/c2fo-and-ripple-partner-to-modernize-trade-finance-using-the-xrp-ledger/). It reads the public RLUSD issuer on the XRP Ledger. It does not attribute payments to C2FO Instant Pay.

The issuer is `rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`. Outstanding RLUSD is that account’s `gateway_balances` obligation. The live tape is every successful RLUSD payment between two different accounts. Payments of 10,000 RLUSD or more are marked large. Offers and self-payments stay off the tape.

Open `index.html` in a browser, or serve this folder:

```
python3 -m http.server 8788
```

Live site: https://c2fo-ripple.garrypolley.com

Production also answers at https://c2fo-ripple.netlify.app. Deploys are manual:

```
netlify deploy --prod --dir . --site c2fo-ripple --no-build
```
