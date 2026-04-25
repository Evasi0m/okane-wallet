# Okane Wallet — SwiftUI iOS Port Specification

> Source: web app at `/Users/j3da1/Desktop/Github/okane-wallet` (HTML + vanilla JS + CSS, Thai language).
> Target: native SwiftUI iOS app, to be built in Codex.

---

## 1. App Purpose & Features

**Okane** (お金 / "เงิน") is a Thai-language personal finance tracker.

Core features:
- **Income & Expense tracking** — daily transactions with amount, category, note, wallet, time
- **Monthly budgeting** — per-category budgets, salary + extra income (`oI`), recurring items
- **Multi-wallet** — cash / bank / card (custom wallets allowed)
- **Recurring expenses** — monthly subscriptions/installments toggleable on/off
- **Savings account** — separate balance with deposit/withdraw history; optional auto-transfer of leftover budget
- **Savings goals** — target + current progress
- **Shopee installments** — separate monthly amount grid (special handling)
- **Carry-forward budgets** — previous month surplus rolls in
- **Insights** — month-over-month delta, top categories, peak spending day
- **Pie chart** — category breakdown
- **Views**: Monthly (default), Daily, Yearly, Simulator (forward projection)
- **Google Drive sync** — appDataFolder, single JSON file
- **PIN lock** — SHA-256 + salt, optional
- **9 themes** — Light, Dark, Basics, Rose, Forest, Emerald, Ocean, Cyber, Slate
- **Privacy toggle** — blur all amount values
- **Guest mode** — local only, no backup

---

## 2. Data Model

Single localStorage key: **`okane_v3`** → JSON store.

```ts
{
  meta: { updatedAt: number },                     // ms timestamp

  mo: {                                            // Monthly data, key "YYYY-MM"
    "2026-04": {
      sal: number,                                 // salary
      oI: [{id, a, n, color, ck}],                 // additional income
      [categoryId]: number,                        // budget per category
      savAutoTransfer: boolean,
      shopee: number                               // legacy/computed from shM
    }
  },

  dLog: {                                          // Daily log, key "YYYY-MM-DD"
    "2026-04-25": [{
      id: "dl_<ts>_<rand>",
      a: number,                                   // amount
      cat: string,                                 // category id
      n: string,                                   // note
      w: string,                                   // wallet id
      t: "HH:MM"
    }]
  },

  settings: {
    salary: number,                                // fallback salary
    savGoal: number,
    showDecimal: boolean,
    hideAmt: boolean,
    lowRemaining: number,                          // default 1000
    warnPct: number,                               // default 90
    weeklyOn: boolean,
    theme: string
  },

  cats: {                                          // categories
    [id]: { id, name, icon, color, budget }
  },

  savings: {
    balance: number,
    history: [{
      id, type: "add"|"withdraw", amount,
      date: ISO, monthKey: "YYYY-MM",
      source: "manual"|"remaining", note
    }]
  },

  shM: { "2026-04": number },                      // Shopee monthly installments
  recur: [{ id: "rc_*", name, amount, cat, on }],  // recurring items
  goals: [{ id: "g_*", name, target, cur }],
  wallets: [{ id, name, type: "cash"|"bank"|"card" }],
  lastWallet: string,

  pin: { enabled, hash, salt, lastUnlock },
  templates: [{ id, name, ...monthlySnapshot }],
  customIcons: { "ICON_LIST.<key>": "<svg>", ... },

  lastSync: ISO,
  driveFileId: string,
  _tombstones: { [collection]: { [id]: ts } },
  userInfo: { name, email, picture }
}
```

### Constants
- **Preset categories**: `pet`, `game`, `travel`, `health`, `sub`, `invest`
- **Legacy categories**: `food` (#F59E0B), `sav` (#10B981), `shopee` (#EE4D2D), `gas` (#2E7DC8)
- **Reserved keys** (not category ids): `sal`, `oI`, `savAutoTransfer`
- **Icon system**: 30+ named SVG icons (coffee, piggy, car, netflix, shopee, grab, …)
- **Timezone**: hard-coded `Asia/Bangkok` for all date keys (`getBangkokNow()`)

---

## 3. Screens & Modals

### Bottom nav
4 views + center FAB:
1. **Daily** (`vw='d'`)
2. **Monthly** (`vw='m'`) — default
3. **Yearly** (`vw='y'`)
4. **Simulator** (`vw='sim'`)
5. **+ FAB** → Quick Add modal

### 3.1 Monthly view
- Hero card: balance (green/red), total income, total expenses
- Savings bar with eye toggle
- Setup banner (first-run nudges: add categories / set salary)
- Alerts (low balance, near-budget %)
- Income section: salary + `oI` list (edit mode)
- Expenses section: budget list per category, edit mode for budget input, click row → category detail
- Shopee row + recurring sub-section + uncategorized "other"
- Insights card (vs last month, top 3 cats, peak day)
- Pie chart (canvas)
- Month pills + reset month button (confirm)

### 3.2 Daily view
- Hero (month name, balance, income/expense)
- Carry-forward alert
- Budget overview grid (spent vs budget)
- Date list of transactions (delete + edit)
- Search box (name + category, Thai-aware, case-insensitive)
- Weekly + monthly summaries (toggle time-sorted vs category-sorted)

### 3.3 Yearly view
- Year navigation
- Goal progress bar (year-to-date vs `savGoal`)
- 12-month grid → tap to jump

### 3.4 Simulator view
- Forward projection N months at current run-rate
- Configurable params, projected balance

### Modals
| ID | Purpose |
|---|---|
| `qaM` | Quick Add (amount, presets +5/+10/+50/+100/+300/+1000 cumulative, wallet, category, note, date) |
| `edM` | Edit existing entry, with Delete + undo toast |
| `cdM` | Category detail (progress bar, transactions list) |
| `catPopup` | Manage categories (preset/legacy/custom, create/delete) |
| `incPopup` | Income (salary + `oI` items) |
| `stM` | Settings (multi-page: main / recurring / goals / wallets / templates / security) |
| `shM` (modal) | Shopee monthly amount grid by year |
| `svM` | Savings deposit/withdraw + history + auto-transfer toggle |
| `pinLock` | 4-dot PIN entry |
| `calPop` | Calendar picker |
| `mpPop` | Month picker |
| `filterPop` | Daily filter (amount range, category, wallet, overspent/carry-only) |
| Guest warning | First-run if not logged in |

---

## 4. Key Flows

### Quick Add
FAB → amount focus → presets cumulative → wallet → category (required) → optional note/date → Save
→ append to `dLog[dateKey]` → toast "บันทึกสำเร็จ!" → switch to daily view.

### Edit / Delete
Tap entry → `edM` → Save updates `dLog[dateKey][i]`; Delete moves to `_lastDelete` and shows undo toast (5s).

### Budget setup
Edit-mode toggle on monthly view, type budget per category → Save → `mo[month][catId] = n`.

### Recurring
Settings → Recurring → add `{name, amount, cat, on}` → counted into monthly calc when `on=true`.

### Savings
`svM` → deposit/withdraw appended to `savings.history`; balance = sum(add) − sum(withdraw).
Optional auto-transfer of leftover budget at month end.

### Shopee
Calendar icon in monthly view → `shM` modal grid of 12 inputs → stored in `shM["YYYY-MM"]`,
mirrored to monthly view (read-only there, source = `shM`).

### Carry-forward
`calc()` reads previous month surplus → injects as `carryIn` for current month → optional sweep to savings.

### Google Drive sync
On boot: load token → fetch `okane_data_v3.json` from `appDataFolder` → merge by `meta.updatedAt` (newer wins).
Mutations → debounced `syncNow()` (1500 ms) → PATCH (`uploadType=media`) or multipart create.
401 → `startSilentAuthRefresh()` → retry. Pending badge in header.

### PIN lock
SHA-256(salt + pin) compared on unlock. Modal blocks app on launch when `pin.enabled`.

### Theme
`settings.theme` → `data-theme` attribute on root → CSS variables swap. In SwiftUI use a
`Theme` enum + `EnvironmentKey` providing a `Palette` struct.

---

## 5. Styling / Theme

### CSS variables
`--bg --tx --ac --gn --rd --bl --pr --sh` (background, text, accent, green, red, blue, purple, Shopee orange).

### Themes (9)
Light, Dark, Basics (mono), Rose — free.
Forest, Emerald, Ocean, Cyber (purple neon), Slate — premium.

### Layout
- Mobile-first, max content width 500 px
- Sticky translucent header (logo + settings/sync/user icons)
- Fixed bottom nav with FAB
- `.sec` cards: 24 px radius, glass-morphism, soft shadow
- Hero card: gradient + animated orbs
- Pills for month/category selectors
- Modals: `.mbg` backdrop + `.mbox` centered card
- Progress bar `.prog-fill`: green <70 %, orange 70–90 %, red >90 %, glow effect

### Type
- Sarabun (Thai), JetBrains Mono for numerals
- Sizes: 24 / 15 / 14 / 13 / 12

### Privacy
`body.hide-amt` blurs (`filter: blur(7px)`) all `.rv .hero-v .rn-t` — toggle via eye icon.

---

## 6. External Integrations

### Google OAuth 2.0 (token client, no server)
- **Client ID**: `933620688457-nqv6qs8381m46t8dn8sqv0qecbcuav82.apps.googleusercontent.com`
- **Scopes**:
  - `https://www.googleapis.com/auth/drive.appdata`
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`
- **Endpoints**:
  - `GET https://www.googleapis.com/oauth2/v2/userinfo`
  - `GET https://www.googleapis.com/drive/v3/files?spaces=appDataFolder`
  - `POST https://www.googleapis.com/upload/drive/v3/files` (multipart create)
  - `PATCH https://www.googleapis.com/upload/drive/v3/files/<id>?uploadType=media`
- **File**: `okane_data_v3.json` in `appDataFolder`

For iOS: use `GoogleSignIn-iOS` SDK or `ASWebAuthenticationSession` + manual Drive REST.
**Generate a new iOS OAuth client** in the same GCP project (different bundle id).

### No other backend
All compute client-side; no analytics, no ads.

---

## 7. Quirks Worth Preserving

1. **Numeric input enhancement** — `inputmode=decimal/numeric`, focus clears `0`, blur restores; sanitize non-numeric chars; single decimal point. (app.js:176–213)
2. **Quick Add presets are cumulative** (not replace).
3. **Lazy month creation** — `gm(y,m)` materializes `mo["YYYY-MM"]` on access only when writing.
4. **Shopee** — source of truth is `shM`, monthly view value is virtual.
5. **Carry-forward** — `calc()` produces `carryIn` map.
6. **Custom icons** — `customIcons` overrides `ICON_LIST` / `IC` at boot.
7. **Bangkok timezone** for all date keys — do not use device local time.
8. **Canvas pie chart** (`drawMC()`); in SwiftUI use Swift Charts `SectorMark`.
9. **Undo toast** — `_lastDelete` snapshot, 5 s window.
10. **Sync pending badge** + exponential backoff on 401.
11. **rMonth split** — recent change: separate expense value-edit from category manage (commit `8afefcd`).
12. **FAB on mobile** — opens numeric keyboard immediately on tap (commit `6c027a3`); replicate via `@FocusState` + `.keyboardType(.decimalPad)` first-responder hack on appear.
13. **Inline SVG editor** — admin/icons editor (`icons.html`, `icons.js`) — out of scope for v1 iOS.
14. **Admin login** — `ADMIN_PASS_HASH` (commit `9f3f797`) gates the SVG editor; not needed in iOS unless porting that surface.

---

## 8. Navigation State

- `vw` — `m | d | y | sim`
- `cY`, `sM_` — current year / month for monthly view
- `viewDate` — selected `Date` for daily view
- `stPage` — settings sub-page id
- `editInc`, `editExp`, `_catEditId` — edit-mode flags
- Modal open via class toggle; in SwiftUI use `.sheet` / `.fullScreenCover` + bindings.

---

## 9. SwiftUI Porting Checklist

Architecture suggestion: **MVVM** with a single `Store: ObservableObject` mirroring the JSON shape.

- [ ] `Store` (Codable) — load from `UserDefaults` JSON blob (key `okane_v3`) for parity, or migrate to `FileManager` (`Application Support/okane_v3.json`)
- [ ] `Calendar(identifier: .gregorian)` with `TimeZone(identifier: "Asia/Bangkok")` everywhere
- [ ] `TabView` (4 tabs) + custom center FAB overlay
- [ ] Sheets per modal; `.presentationDetents` for compact sheets
- [ ] Swift Charts for pie + bar
- [ ] `@FocusState` + `.keyboardType(.decimalPad)` for numeric inputs
- [ ] Theme: `enum Theme: String, CaseIterable` → `Palette` struct injected via `Environment`
- [ ] Privacy: view modifier `.redacted(reason: .privacy)` or custom blur
- [ ] PIN: `CryptoKit.SHA256`; consider Keychain for hash + salt; LocalAuthentication for Face ID upgrade later
- [ ] Google Sign-In: `GoogleSignIn-iOS` SPM package, then raw URLSession against Drive REST
- [ ] Sync: actor-based debounce (1500 ms), background `URLSession`, retry on 401 → silent refresh
- [ ] Tombstones — replicate `_tombstones` dictionary on delete operations
- [ ] Localization — all strings to `Localizable.strings` (th as default)
- [ ] Custom SVG icons — render via `WKWebView` snapshot or convert presets to SF Symbols / asset catalog
- [ ] Undo: `@Published var lastDelete: PendingDelete?` with 5 s timer

### Suggested Swift modules
```
Okane/
  Models/         Store, Transaction, Category, Wallet, Recurring, Goal, SavingsEntry
  Persistence/    LocalStore (JSON), Tombstones, Migrations
  Sync/           DriveClient, OAuthManager, SyncQueue
  Theme/          Palette, ThemeEnvironment
  Features/
    Monthly/      MonthlyView, MonthlyVM, HeroCard, ExpenseList, PieChart
    Daily/        DailyView, DailyVM, EntryRow, SearchBar
    Yearly/       YearlyView, YearlyVM
    Simulator/    SimulatorView, SimVM
    QuickAdd/     QuickAddSheet
    Settings/     SettingsRoot + sub-pages
    Savings/      SavingsSheet
    PIN/          PINLockView
  Components/     FAB, ModalBackground, ProgressBar, AmountText, MonthPills
  Util/           BangkokDate, NumberFormatting, ThaiMonthNames, CryptoHash
```

---

## 10. App metadata (current web build)

- Version: **0.2.2**
- `app.js` ~ 2 176 LOC, `index.html` ~ 1.8 MB (assets inline), `styles.css` ~ 80 KB
- Browser baseline: ES6+, `localStorage`, `fetch`, `crypto.subtle`
- All UI text in Thai, Thai month names

---

This document is the source of truth for the SwiftUI port. Open `app.js`, `styles.css`, `index.html` for exact field names / class names where parity matters (especially the sync JSON shape — keep keys identical so existing users' Drive backups load on iOS).
