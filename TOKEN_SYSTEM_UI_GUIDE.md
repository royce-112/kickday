# Token System - Visual UI Guide

## 1. HEADER - Token Balance Display

```
┌─────────────────────────────────────────────────────────────┐
│ 💧 AquaScan                    ⚡150 Tokens    🧪 v1.0       │
│ Heavy Metal Pollution Index    
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Yellow badge showing current token balance
- Always visible in header
- Quick reference for users
- Position: Top-right corner

---

## 2. UPLOAD PAGE - Dataset Processing

### Small Dataset (≤50 rows)
```
┌──────────────────────────────────────────────┐
│  📊 Dataset Uploaded                          │
│  my_data.csv • 2.5 MB • 45 rows              │
│                                              │
│         ✓ Uploaded                           │
│                                              │
│  ✅ FREE: Your dataset qualifies for         │
│     free processing and analysis.            │
└──────────────────────────────────────────────┘
```

### Large Dataset (>50 rows, No Tokens)
```
┌──────────────────────────────────────────────┐
│  📊 Dataset Uploaded                          │
│  my_data.csv • 2.5 MB • 150 rows            │
│                                              │
│  🔒 LARGE DATASET DETECTED!                  │
│  Your dataset contains 150 rows. Datasets    │
│  with more than 50 rows require tokens to    │
│  process.                                    │
│                                              │
│  You have 0 tokens available.                │
│                                              │
│  [⚡ GET TOKENS]                             │
└──────────────────────────────────────────────┘
```

### Large Dataset (>50 rows, Has Tokens)
```
┌──────────────────────────────────────────────┐
│  📊 Dataset Uploaded                          │
│  my_data.csv • 2.5 MB • 150 rows            │
│                                              │
│         ✓ Uploaded                           │
│                                              │
│            [GO TO ANALYSIS]                  │
└──────────────────────────────────────────────┘
```

---

## 3. PREDICTIONS PAGE - Pricing Tab

### Main View - Token Balance
```
┌─────────────────────────────────────────────────────┐
│                  Your Token Balance                  │
│                                                     │
│                      ⚡ 150                          │
│                                                     │
│            Tokens available for processing         │
│                                                     │
│  💡 No tokens? Get some below! Want to process     │
│  large datasets (>50 rows) or run predictions?     │
└─────────────────────────────────────────────────────┘
```

### Pricing Plans Display
```
┌──────────────┬──────────────┬──────────────┐
│  STARTER     │  RESEARCH ⭐  │ INSTITUTIONAL│
├──────────────┼──────────────┼──────────────┤
│              │              │              │
│   50         │   150        │    500       │
│  TOKENS      │  TOKENS      │  TOKENS      │
│              │              │              │
│  ₹499        │  ₹1,299      │  ₹3,999      │
│  ₹9.98/token │  ₹8.66/token │  ₹7.99/token │
│              │              │              │
│  ✓ Large     │  ✓ Large     │  ✓ Large     │
│    dataset   │    dataset   │    dataset   │
│    processing│   processing │   processing │
│  ✓ Predictions│ ✓ Predictions│ ✓ Predictions│
│  ✓ Advanced  │  ✓ Advanced  │  ✓ Advanced  │
│    analysis  │    analysis  │    analysis  │
│  ✓ PDF export│  ✓ PDF export│  ✓ PDF export│
│    & CSV     │    & CSV     │    & CSV     │
│              │              │              │
│ [Select Plan]│[Select Plan] │[Select Plan] │
│              │   SELECTED   │              │
│              │   ✓          │              │
└──────────────┴──────────────┴──────────────┘
```

### Token Usage Guide
```
┌────────────────────────────────────────────┐
│  How Many Tokens Do I Need?                │
│                                            │
│  1. Large Dataset Processing               │
│     └─ 1 token per dataset (>50 rows)     │
│                                            │
│  2. Prediction Analysis                    │
│     └─ 3 tokens for full prediction       │
│        analytics & forecasting            │
│                                            │
│  ✓ Always Free                             │
│     └─ Datasets with ≤50 rows with full   │
│        analysis                           │
└────────────────────────────────────────────┘
```

---

## 4. TOKEN PURCHASE FLOW

### Step 1: Plan Selection
```
┌──────────────────────────────────────────────┐
│  GET MORE TOKENS                             │
│  Purchase tokens to unlock advanced         │
│  features and process large datasets.       │
│                                              │
│  [Select Plan Cards]                        │
│                                              │
│  ENTERPRISE & GOVERNMENT                     │
│  ┌──────────────────────────────────────┐   │
│  │ Need custom token packages or bulk   │   │
│  │ discounts?                           │   │
│  │                                      │   │
│  │       [CONTACT SALES]                │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Current Balance: 0 tokens available        │
└──────────────────────────────────────────────┘
```

### Step 2: Order Review
```
┌──────────────────────────────────────────────┐
│  GET MORE TOKENS                             │
│                                              │
│  ℹ️  You are about to purchase 150 tokens    │
│      at ₹1,299                              │
│                                              │
│  ORDER SUMMARY                               │
│  ├─ Tokens: 150                             │
│  └─ Total Price: ₹1,299                     │
│                                              │
│  ✓ After purchase, you'll have               │
│    150 total tokens available.              │
│                                              │
│  💡 By clicking "Simulate Purchase",        │
│  we'll add tokens to your account for       │
│  demo purposes. In production, you          │
│  would be redirected to payment gateway.    │
│                                              │
│  [BACK]          [SIMULATE PURCHASE]       │
└──────────────────────────────────────────────┘
```

### Success Notification
```
┌────────────────────────────────────┐
│ ✓ Tokens added successfully!       │
│   Your new balance: 150             │
└────────────────────────────────────┘
```

---

## 5. ANALYSIS PAGE - Token Indicators

### Free Dataset Analysis
```
┌────────────────────────────────────────────┐
│  SMALL DATASET - FREE TIER                 │
│  ├─ Full HMPI analysis: ✓ Included        │
│  ├─ Export to CSV: ✓ Included              │
│  ├─ Export to PDF: ✓ Included              │
│  └─ All visualizations: ✓ Included        │
│                                            │
│  No tokens required for this dataset.      │
└────────────────────────────────────────────┘
```

### Premium Features (Token Required)
```
┌────────────────────────────────────────────┐
│  LARGE DATASET - PREMIUM FEATURES          │
│  ├─ Full HMPI analysis: 1 token            │
│  ├─ Prediction analysis: 3 tokens          │
│  ├─ Export to PDF: Included                │
│  └─ All visualizations: Included           │
│                                            │
│  Current balance: 150 tokens               │
│  [✓ PROCESS DATASET]                       │
└────────────────────────────────────────────┘
```

---

## 6. PRICING TABLE (Info Card)

```
┌─────────────────────────────────────────────────┐
│         PRICING PLANS (Initial Phase)           │
├────────────┬──────────┬────────┬──────────────┤
│ Package    │ Tokens   │ Price  │ Cost/Token   │
├────────────┼──────────┼────────┼──────────────┤
│ Starter    │    50    │  ₹499  │  ₹9.98       │
│ Research   │   150    │ ₹1,299 │  ₹8.66       │
│ Instit.    │   500    │ ₹3,999 │  ₹7.99       │
│ Gov/Custom │ Custom   │ Negot. │ Lower bulk   │
└────────────┴──────────┴────────┴──────────────┘
```

---

## 7. USER JOURNEY - With Tokens

```
START
  ↓
UPLOAD FILE
  ├─ Small (≤50 rows)
  │   ├─ Show FREE indicator
  │   ├─ Process immediately (no tokens)
  │   └─ END
  │
  └─ Large (>50 rows)
      ├─ Check token balance
      ├─ Has tokens?
      │   ├─ YES → Process with token deduction
      │   │        └─ END
      │   │
      │   └─ NO → Show purchase modal
      │            ├─ User selects plan
      │            ├─ Review order
      │            ├─ Simulate purchase
      │            ├─ Add tokens to balance
      │            ├─ Process dataset
      │            └─ END
```

---

## 8. COLOR SCHEME & STYLING

### Colors Used
```
Free Tier        → 🟢 Green   (Bg: #22c55e)
Premium/Paid     → 🔵 Blue    (Bg: #3b82f6)
Large Dataset    → 🟡 Yellow  (Bg: #eab308)
Warnings         → 🟠 Orange  (Bg: #f59e0b)
Tokens/Balance   → ⚡ Yellow  (Bg: #fef3c7)
Popular Plan     → 🔷 Blue    (Bg: #eff6ff)
Positive Action  → 🟢 Green   (Bg: #22c55e)
```

### Icons Used
```
⚡ Zap/Lightning    → Tokens, Energy, Premium
💰 Money           → Pricing, Cost, Payment
🔒 Lock            → Restricted, Premium
✓ Check            → Success, Verified, Valid
ℹ️  Info            → Information, Details
⚠️  Warning         → Alert, Attention needed
📊 Chart           → Data, Analytics
💳 Credit Card     → Payment method
```

---

## 9. RESPONSIVE DESIGN

### Desktop (Full Width)
```
┌─────────────────────────────────────────────────┐
│ Header with token balance               v1.0    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Pricing Plans (3 columns side by side)         │
│                                                 │
│  Token Usage Guide (4 columns)                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Tablet (2 Columns)
```
┌──────────────────────────────┐
│ Header with token balance    │
├──────────────────────────────┤
│  Pricing Plans               │
│  (2 columns)                 │
│                              │
│  Token Usage Guide           │
└──────────────────────────────┘
```

### Mobile (1 Column)
```
┌────────────────────────┐
│ Header with balance    │
├────────────────────────┤
│                        │
│ Pricing Plans          │
│ (stacked vertically)   │
│                        │
│ Token Usage Guide      │
│ (full width)           │
└────────────────────────┘
```

---

## 10. INTERACTION EXAMPLES

### Scenario: User with 0 tokens uploads large file

```
1. User selects 100-row CSV
   ↓
2. System analyzes and detects >50 rows
   ↓
3. Shows warning: "Large Dataset Detected"
   "You have 0 tokens available"
   ↓
4. User clicks [GET TOKENS]
   ↓
5. TokenPurchaseModal opens
   ↓
6. User selects "Research" plan (150 tokens, ₹1,299)
   ↓
7. Modal shows order review
   ↓
8. User clicks [SIMULATE PURCHASE]
   ↓
9. Toast notification: "Tokens added successfully! 
                         Your new balance: 150"
   ↓
10. Modal closes
    ↓
11. Original dialog updates showing tokens available
    ↓
12. User can now process the large dataset
```

---

## Summary

The token system provides:
- ✓ Clear visual feedback about costs
- ✓ Intuitive purchase flow
- ✓ Real-time balance updates
- ✓ Responsive design for all devices
- ✓ Color-coded information hierarchy
- ✓ Accessible user journeys
- ✓ Multiple pricing tiers
- ✓ Easy token purchase integration
