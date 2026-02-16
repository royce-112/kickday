# HMPI Token System Implementation Guide

## Overview

A complete token-based monetization system has been implemented for the HMPI calculator project. This system allows users to:

- **Process small datasets (≤50 rows)**: Completely FREE
- **Process large datasets (>50 rows)**: Requires tokens (1 token per dataset)
- **Use prediction features**: Requires tokens (3 tokens for full analytics)
- **Purchase tokens**: Interactive pricing plans with three tiers

## Token Pricing Plans

| Package | Tokens | Price | Cost/Token |
|---------|--------|-------|-----------|
| **Starter** | 50 | ₹499 | ₹9.98 |
| **Research** (Popular) | 150 | ₹1,299 | ₹8.66 |
| **Institutional** | 500 | ₹3,999 | ₹7.99 |
| **Government/Custom** | Custom | Negotiated | Lower bulk rate |

## Token Usage

- **1 token** = Process one dataset with > 50 rows
- **3 tokens** = Run full prediction analysis
- **Free** = All features for datasets with ≤ 50 rows

## Frontend Components

### 1. **DataContext** (`src/context/DataContext.tsx`)
- Manages user authentication and token balance
- Stores user data in localStorage
- Provides `useDataset()` hook for accessing tokens globally
- Methods: `addTokens()`, `deductTokens()`, `setTokens()`

### 2. **PricingPlans** (`src/components/PricingPlans.tsx`)
- Displays all three pricing tiers in an interactive card layout
- Shows benefits and feature highlights for each plan
- Includes info section about token usage
- Can be integrated anywhere in the UI

### 3. **TokenPurchaseModal** (`src/components/TokenPurchase.tsx`)
- Modal dialog for purchasing tokens
- Two-step flow: Plan selection → Review order
- Shows order summary and simulates purchase
- In production, would redirect to payment gateway
- Mock implementation adds tokens directly to user account

### 4. **TokenDisplay** (`src/components/TokenDisplay.tsx`)
- Compact/full size token balance display
- Shows current available tokens
- "Buy More" button to open purchase modal
- Used in Header and Predictions page

### 5. **Header** (`src/components/Header.tsx`) - **UPDATED**
- Now displays current token balance
- Shows balance in a highlighted badge at the top-right

### 6. **DatasetUpload** (`src/components/DatasetUpload.tsx`) - **UPDATED**
- Checks file row count automatically
- Shows warning if dataset > 50 rows and no tokens
- Displays "Get Tokens" button for users without sufficient balance
- Free tier indicator for small datasets (≤50 rows)

### 7. **Predictions** (`src/components/Predictions.tsx`) - **UPDATED**
- New "Pricing" tab with interactive pricing plans
- Token balance display
- Usage guide showing token costs
- Token purchase modal integration
- Success notification when tokens are purchased

## Backend Endpoints

### Token Management Endpoints

#### 1. **GET /token/pricing**
Returns pricing and token usage information.

**Response:**
```json
{
  "plans": [
    {
      "name": "Starter",
      "tokens": 50,
      "price": 499,
      "currency": "INR",
      "cost_per_token": 9.98
    },
    // ... more plans
  ],
  "token_usage": {
    "large_dataset_processing": 1,
    "prediction_analysis": 3,
    "description": {
      "large_dataset_processing": "Processing 1 dataset with > 50 rows",
      "prediction_analysis": "Running full prediction analytics"
    }
  },
  "free_tier": {
    "max_rows": 50,
    "features": ["Full HMPI analysis", "Export to CSV/PDF", "Visualizations"]
  }
}
```

#### 2. **POST /token/check-status**
Check if user has enough tokens for an operation.

**Request:**
```json
{
  "user_id": "user_123",
  "tokens_needed": 3
}
```

**Response:**
```json
{
  "user_id": "user_123",
  "current_tokens": 150,
  "tokens_needed": 3,
  "sufficient_tokens": true,
  "tokens_short": 0
}
```

#### 3. **POST /token/add**
Add tokens to a user account (for demo/testing).

**Request:**
```json
{
  "user_id": "user_123",
  "tokens": 50
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "user_123",
  "tokens_added": 50,
  "new_balance": 200,
  "message": "Added 50 tokens"
}
```

#### 4. **POST /token/deduct**
Deduct tokens from a user account (when features are used).

**Request:**
```json
{
  "user_id": "user_123",
  "tokens": 1
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "user_123",
  "tokens_deducted": 1,
  "new_balance": 199
}
```

#### 5. **GET /token/get-balance**
Get current token balance for a user.

**Query Params:** `?user_id=user_123`

**Response:**
```json
{
  "user_id": "user_123",
  "balance": 199,
  "email": "user@example.com"
}
```

## User Flow

### Free Dataset Processing (≤50 rows)
1. User uploads CSV/Excel file
2. System detects row count
3. Shows "Free processing" indicator
4. User can proceed without tokens
5. Full HMPI analysis available
6. Can export results freely

### Large Dataset Processing (>50 rows)
1. User uploads CSV/Excel file
2. System detects row count > 50
3. Shows warning: "Large Dataset Detected"
4. Checks if user has ≥1 token
5. If no tokens:
   - Show token purchase modal
   - User can select a plan
   - Simulate purchase (adds tokens to account)
6. If tokens available:
   - Process dataset normally
   - Deduct 1 token from balance

### Prediction Features
1. User navigates to "Predictions" tab
2. Can view pricing plans
3. Can see current token balance
4. If insufficient tokens (need 3):
   - Show token purchase modal
   - User purchases tokens
5. Can then access all prediction analytics

## Implementation Details

### Token Storage
- Tokens stored in `localStorage` on client side (for demo)
- User data persists across sessions
- Anonymous users created with `anon_${timestamp}` ID
- In production: Use secure backend sessions + database

### Data Flow
```
User uploads file
    ↓
Check row count
    ↓
If ≤50 rows → Process FREE
    ↓
If >50 rows → Check tokens
    ↓
If no tokens → Show purchase modal
    ↓
User buys tokens → Add to balance
    ↓
Process dataset with token deduction
```

### Mock Payment System
Current implementation simulates token purchases:
- User selects plan
- System shows order review
- "Simulate Purchase" button adds tokens to account
- In production: Integrate Stripe/PayPal/Razorpay

## Integration Points

### For Existing Features
The token system is integrated at:
1. **DatasetUpload** - Gating for large datasets
2. **Predictions** - Pricing display and purchases
3. **Export** - Can add token requirements for premium exports
4. **Analysis** - Can show token usage for advanced features

### To Add Token Gating to New Features
```javascript
import { useDataset } from '@/context/DataContext';

const MyComponent = () => {
  const { tokens, deductTokens } = useDataset();
  
  const handleFeatureUse = () => {
    const tokenCost = 2;
    if (tokens < tokenCost) {
      // Show purchase modal
      return;
    }
    deductTokens(tokenCost);
    // Use feature
  };
};
```

## Testing

### Test Scenarios

1. **Free tier (≤50 rows)**
   - Upload CSV with 30 rows
   - Should show "Free processing" indicator
   - No token deduction

2. **Large dataset (>50 rows, no tokens)**
   - Upload CSV with 100 rows
   - Should show "Get Tokens" warning
   - Modal opens automatically

3. **Token purchase flow**
   - Select Starter plan (50 tokens)
   - Click "Simulate Purchase"
   - Balance updates to 50
   - Can now process large datasets

4. **Prediction access**
   - Go to Predictions tab
   - Click "Pricing" tab
   - See all plans and current balance
   - Can purchase tokens

## Future Enhancements

1. **Real Payment Integration**
   - Connect to Stripe/Razorpay
   - Handle payment webhooks
   - Verify transactions in backend

2. **Token Analytics**
   - Track token usage per user
   - Show token expense reports
   - Analytics dashboard

3. **Token Plans Enhancement**
   - Subscription plans (recurring)
   - Bulk discounts
   - Promotional codes

4. **Premium Features**
   - Private data storage
   - Advanced export formats
   - Priority support
   - Custom analysis tools

5. **User Management**
   - Team accounts
   - Token sharing pools
   - Admin dashboard
   - Usage limits per user

## Authentication Note

Current implementation uses localStorage with anonymous users. For production:
1. Implement proper user authentication (OAuth, JWT)
2. Store tokens in secure database
3. Use backend sessions
4. Implement proper token expiry
5. Add audit logging

## Support

For issues or questions about the token system:
1. Check backend logs in `proj.py`
2. Verify MongoDB connection
3. Check browser console for frontend errors
4. Ensure all components are properly imported
