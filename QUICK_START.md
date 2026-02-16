# Token System - Quick Start Guide

## 🚀 Quick Overview

The HMPI calculator now has a complete token-based monetization system. Here's what changed:

### What Users See

1. **Header** - Shows current token balance (⚡150 Tokens)
2. **Upload** - Warns about large datasets (>50 rows) and token requirements
3. **Predictions** - New "Pricing" tab with interactive pricing plans and purchase options

### What's Free vs. Paid

| Feature | Free | Paid |
|---------|------|------|
| Small datasets (≤50 rows) | ✓ | - |
| Large datasets (>50 rows) | - | 1 token |
| HMPI analysis & export | ✓ | ✓ |
| Prediction features | - | 3 tokens |

---

## 💻 Developer Quick Start

### 1. Verify Installation

All files have been created and integrated:

```bash
# Frontend components created:
✓ src/components/PricingPlans.tsx
✓ src/components/TokenPurchase.tsx
✓ src/components/TokenDisplay.tsx

# Frontend modified:
✓ src/context/DataContext.tsx
✓ src/components/Header.tsx
✓ src/components/DatasetUpload.tsx
✓ src/components/Predictions.tsx
✓ src/App.tsx (already had DatasetProvider)

# Backend modified:
✓ proj.py (added 6 new endpoints)
```

### 2. Start the Application

```bash
# Terminal 1: Backend
cd c:\programming\ML_PYTHON\HMPI
python proj.py

# Terminal 2: Frontend
npm run dev
```

### 3. Test Token Features

**Open http://localhost:5173**

#### Test 1: Free Dataset
1. Go to Upload → Select a small CSV (< 50 rows)
2. See "✅ Free: Your dataset qualifies for free processing"
3. Click "Go to Analysis" (no tokens needed)

#### Test 2: Large Dataset Warning
1. Go to Upload → Select a larger CSV (> 50 rows)
2. See "🔒 Large Dataset Detected" warning
3. See "Get Tokens" button

#### Test 3: Buy Tokens
1. Click "Get Tokens" button
   OR
   Go to Predictions → Pricing tab
2. Select a plan (e.g., Starter = 50 tokens)
3. Review order
4. Click "Simulate Purchase"
5. See success notification
6. Check header - balance updated! ⚡150 Tokens

#### Test 4: Use Tokens
1. After purchasing tokens
2. Upload large dataset (>50 rows)
3. Should process normally
4. Token balance decreases

---

## 📊 Pricing Plans

```
┌─────────────┬────────┬───────────┐
│ Plan        │ Tokens │ Price     │
├─────────────┼────────┼───────────┤
│ Starter     │    50  │ ₹499      │
│ Research ⭐ │   150  │ ₹1,299    │
│ Institutional│  500  │ ₹3,999    │
└─────────────┴────────┴───────────┘

Token Costs:
• 1 token = Process large dataset (>50 rows)
• 3 tokens = Full prediction analysis
• FREE = All features for ≤50 row datasets
```

---

## 🔧 Backend API Endpoints

### Get Pricing Info
```bash
GET http://localhost:5000/token/pricing
```

### Check Token Status
```bash
POST http://localhost:5000/token/check-status
Body: {
  "user_id": "user_123",
  "tokens_needed": 3
}
```

### Add Tokens (Demo)
```bash
POST http://localhost:5000/token/add
Body: {
  "user_id": "user_123",
  "tokens": 50
}
```

### Deduct Tokens
```bash
POST http://localhost:5000/token/deduct
Body: {
  "user_id": "user_123",
  "tokens": 1
}
```

### Get Balance
```bash
GET http://localhost:5000/token/get-balance?user_id=user_123
```

---

## 🎯 Key Features

### 1. Smart Row Detection
```javascript
// Automatically detects if dataset needs tokens
if (rowCount > 50 && tokens < 1) {
  // Show purchase modal
}
```

### 2. User Persistence
```javascript
// Tokens saved to localStorage
// Persist across browser sessions
const user = localStorage.getItem('hmpi_user');
```

### 3. Context-Based Access
```javascript
// Access tokens anywhere in app
import { useDataset } from '@/context/DataContext';

const MyComponent = () => {
  const { tokens, addTokens, deductTokens } = useDataset();
  // Use tokens...
};
```

### 4. Interactive Pricing Display
- Three pricing tiers with compare feature
- "Most Popular" badge on Research plan
- Cost per token shown for each plan
- Government/Custom tier option

### 5. Mock Payment System
- Full purchase flow implemented
- Simulates adding tokens
- In production: Connect to Stripe/PayPal/Razorpay

---

## 📱 User Interface

### Header Token Display
```
┌────────────────────────────────────────┐
│ 💧 AquaScan  ⚡150 Tokens  🧪 v1.0      │
└────────────────────────────────────────┘
```

### Pricing Tab
```
Payment Plans
├─ Starter (50 tokens, ₹499)
├─ Research (150 tokens, ₹1,299) ⭐ Popular
├─ Institutional (500 tokens, ₹3,999)
└─ Token Usage Guide
```

### Dataset Upload Alert
```
IF >50 rows & no tokens:
🔒 LARGE DATASET DETECTED!
"Get Tokens" button

IF ≤50 rows:
✅ FREE: Your dataset qualifies
```

---

## 🔐 Data Storage

### Current (Demo) - localStorage
```javascript
// User stored in browser storage
{
  userId: "anon_1234567890",
  name: "Anonymous User",
  email: "",
  tokens: 150
}
```

### Production (Recommended)
- Store in MongoDB/Database
- Use JWT/OAuth for auth
- Secure backend sessions
- HTTPS encryption required

---

## 🚨 Troubleshooting

### Tokens not showing in header?
```
1. Check if DatasetProvider is in App.tsx ✓
2. Verify useDataset() is imported
3. Check localStorage: 
   localStorage.getItem('hmpi_user')
```

### Purchase modal not opening?
```
1. Check TokenPurchaseModal is imported
2. Verify isTokenModalOpen state
3. Check onClose callback
```

### Large dataset not warning?
```
1. Verify row detection logic in DatasetUpload
2. Check if CSV file parsing works
3. Test with actual CSV file
```

### Token balance not updating?
```
1. Check localStorage is enabled
2. Verify addTokens() is called
3. Check DataContext.tsx methods
```

---

## 📈 Future Enhancements

### Phase 2 - Payment Integration
- [ ] Connect Stripe API
- [ ] Handle payment confirmation
- [ ] Email receipts
- [ ] Transaction history

### Phase 3 - Premium Features
- [ ] Subscription plans
- [ ] Team accounts
- [ ] Usage analytics
- [ ] Bulk discounts

### Phase 4 - Admin Dashboard
- [ ] User management
- [ ] Revenue tracking
- [ ] Analytics dashboard
- [ ] Refund handling

---

## 📋 File Changes Summary

### New Files (3)
1. `PricingPlans.tsx` - 150 lines
2. `TokenPurchase.tsx` - 120 lines
3. `TokenDisplay.tsx` - 50 lines

### Modified Files (4)
1. `DataContext.tsx` - +60 lines (user/token state)
2. `Header.tsx` - +5 lines (token display)
3. `DatasetUpload.tsx` - +100 lines (row checking)
4. `Predictions.tsx` - +150 lines (pricing tab)

### Backend Changes (1)
1. `proj.py` - +180 lines (6 new endpoints)

### Documentation (3)
1. `TOKEN_SYSTEM_GUIDE.md` - Complete reference
2. `TOKEN_IMPLEMENTATION_CHECKLIST.md` - Implementation details
3. `TOKEN_SYSTEM_UI_GUIDE.md` - Visual guide
4. `QUICK_START.md` - This file

---

## ✅ Verification Checklist

- [ ] Start both frontend (`npm run dev`) and backend (`python proj.py`)
- [ ] Open http://localhost:5173
- [ ] See token balance in header (⚡ 0 Tokens initially)
- [ ] Go to Upload, select small CSV → See green "Free" indicator
- [ ] Go to Upload, select large CSV → See yellow "Large Dataset" warning
- [ ] Click "Get Tokens" → Modal opens with pricing plans
- [ ] Select "Starter" plan (50 tokens) → Review shows ₹499
- [ ] Click "Simulate Purchase" → Toast: "Tokens added successfully"
- [ ] Header shows ⚡ 50 Tokens now
- [ ] Go to Predictions → Pricing tab → See pricing plans
- [ ] Large dataset processing works with 1 token deduction
- [ ] Tokens persist after page reload (check localStorage)

---

## 🎓 Learning Resources

### Understanding the Token System

1. **Context Management**
   - See: `DataContext.tsx`
   - Manages global token state
   - Provides useDataset() hook

2. **Component Integration**
   - See: `DatasetUpload.tsx`
   - Row count detection
   - Token gating logic

3. **UI Components**
   - See: `PricingPlans.tsx`
   - Pricing display
   - Plan comparison

4. **Backend Integration**
   - See: `proj.py` token endpoints
   - Token operations
   - Pricing info retrieval

---

## 📞 Support

For issues or questions:
1. Check TOKEN_SYSTEM_GUIDE.md for detailed docs
2. Review TOKEN_IMPLEMENTATION_CHECKLIST.md for implementation
3. Look at TOKEN_SYSTEM_UI_GUIDE.md for UI reference
4. Check component prop definitions in TypeScript

---

## 🎉 Success!

Your HMPI calculator now has a complete token-based monetization system!

Users can:
- ✓ Process small datasets for FREE
- ✓ Buy tokens for large datasets
- ✓ View interactive pricing
- ✓ Track token balance
- ✓ Purchase with simulated payments

Ready for:
- Production payment integration
- Real user authentication
- Analytics tracking
- Premium feature expansion

---

**Created:** February 2026  
**Version:** 1.0  
**Status:** ✅ Complete & Ready to Use
