# Tijori

**Your money, locked in your phone.** Tijori reads bank and card SMS on an Android phone, turns them into a clean ledger of what you spent and earned, and auto-categorises everything — without anything ever leaving the device.

## Privacy model

| Guarantee | How it's enforced |
|---|---|
| Nothing is uploaded | Release builds have the `INTERNET` permission **removed** from the manifest (`plugins/with-tijori-privacy.js`). The app physically can't reach the network. |
| Only bank SMS are read | The native module drops any message from a phone-number sender before it reaches JS; the parser then ignores OTPs, reminders, offers and failed payments. |
| Data is encrypted at rest | SQLCipher database with a random 256-bit key held in the Android Keystore (`expo-secure-store`). |
| No OS backups | `allowBackup=false` plus data-extraction rules that exclude everything from cloud backup and device transfer. |

## Running it

SMS access needs native code, so Tijori runs as a development build (not Expo Go) on an Android phone or emulator.

```bash
npm install
npm run android        # = npx expo run:android — builds and installs the dev app
```

On an emulator, send test SMS from **Extended controls → Phone**, using a sender like `AD-HDFCBK`:

```
Rs.450.00 debited from A/c XX1234 on 05-10-26 to VPA swiggy@icici. UPI Ref 627812345678
```

Other scripts: `npm test` (parser tests), `npm run typecheck`, `npm run lint`.

To check the privacy guarantee on a release build:

```bash
cd android && ./gradlew assembleRelease
# then confirm INTERNET is absent:
aapt dump permissions app/build/outputs/apk/release/app-release.apk
```

## How it works

```
Inbox / live SMS ──► native module (sender filter) ──► parser ──► categoriser ──► encrypted SQLite ──► UI
```

- **`modules/tijori-sms/`** — local Expo module (Kotlin). `readInboxAsync(since)` queries the SMS inbox; an `onSmsReceived` event streams new messages while the app is open.
- **`src/lib/parser/`** — pure TypeScript, unit-tested:
  - `sms-parser.ts` — amount, debit/credit, account, UPI handle, reference, merchant; rejects noise.
  - `bank-directory.ts` — sender header (`HDFCBK`) → bank name. **Add new banks here.**
  - `merchant.ts` — cleans merchant names and recognises brands and person-to-person UPI.
  - `categorizer.ts` — user rules → income signals → keyword lists → body hints.
- **`src/lib/db/`** — SQLCipher setup, migrations, and queries. Duplicate SMS are merged by UPI reference or by sender + body within 5 minutes.
- **`src/state/`** — permission gate and the app store (scans on open/foreground, listens live, edits categories).
- **`src/app/`** — Expo Router screens: onboarding, home dashboard, transactions, transaction detail.

The inbox is the source of truth, so if the app is uninstalled, reinstalling and rescanning rebuilds most of the history (custom categories are lost).

## Adding a bank format

1. Add a failing example to `src/lib/__tests__/sms-parser.test.ts`.
2. Add the sender header to `bank-directory.ts` if it's new.
3. Adjust the patterns in `sms-parser.ts` until `npm test` passes.

## Roadmap

- Biometric app lock
- Encrypted export / import backup file (user picks where to save it)
- Recurring payment detection (subscriptions, EMIs, salary)
- Budgets per category
