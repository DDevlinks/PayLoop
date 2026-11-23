# PayLoop Format Utilities Guide

This document describes the format utility functions in `web/lib/format.ts` and how to use them correctly when working with token amounts, addresses, and dates in the PayLoop dApp.

## Overview

PayLoop stores token amounts on-chain in base units (stroops) with 7 decimal places for USDC. The format utilities handle conversions between:

- **Base units (stroops):** `bigint` values stored in the contract (e.g., `1000000n` = 0.1 USDC)
- **Human-readable values:** strings/numbers suitable for UI display (e.g., `"0.1"`)
- **Formatted display:** strings with thousand separators for rendering (e.g., `"1,000.5"`)

## Token Amount Conversions

### `toBaseUnits(human, decimals?)`

Converts human-readable token amounts to base units (stroops).

**Parameters:**
- `human` (string | number): The amount in human-readable form
- `decimals` (number, optional): Token decimals; defaults to 7 for USDC

**Returns:** `bigint` — the amount in base units

**Examples:**

```typescript
// USDC has 7 decimals by default
toBaseUnits("100")          // → 1000000000n (100 USDC in stroops)
toBaseUnits("0.1")          // → 1000000n (0.1 USDC)
toBaseUnits("0.0000001")    // → 1n (smallest unit)

// Custom decimals for other tokens
toBaseUnits("100", 2)       // → 10000n (for 2-decimal tokens)

// Numeric input
toBaseUnits(100)            // → 1000000000n
```

**When to use:**
- Converting user input from form fields to submit to the contract
- Calculating contract payment amounts from decimal values
- Storing amounts internally in base units

**Edge cases:**
- Empty strings or whitespace → `0n`
- Excess decimal places are truncated (not rounded)
- Negative numbers are supported: `toBaseUnits("-100")` → `-1000000000n`

### `fromBaseUnits(base, decimals?)`

Converts base units back to human-readable decimal strings.

**Parameters:**
- `base` (bigint | string | number): The amount in base units
- `decimals` (number, optional): Token decimals; defaults to 7 for USDC

**Returns:** `string` — the amount as a decimal string with no thousand separators

**Examples:**

```typescript
// USDC with 7 decimals (default)
fromBaseUnits(1000000000n)    // → "100"
fromBaseUnits(1000000n)       // → "0.1"
fromBaseUnits(1n)             // → "0.0000001"

// Removes trailing zeros
fromBaseUnits(1500000n)       // → "1.5" (not "1.5000000")

// Accept string or numeric base units
fromBaseUnits("1000000000")   // → "100"
fromBaseUnits(1000000000)     // → "100"

// Custom decimals
fromBaseUnits(10000n, 2)      // → "100"
```

**When to use:**
- Displaying on-chain amounts in the UI
- Converting contract return values for user display
- Calculations that need to work with decimal places

**Edge cases:**
- Trailing zeros are always removed
- Result is never in scientific notation (safe for display)

### `formatAmount(base, decimals?)`

Converts base units to a formatted string with thousand separators.

**Parameters:**
- `base` (bigint | string | number): The amount in base units
- `decimals` (number, optional): Token decimals; defaults to 7 for USDC

**Returns:** `string` — formatted for display with comma separators

**Examples:**

```typescript
// Apply thousand separators
formatAmount(1000000000n)       // → "1,000"
formatAmount(1500000000n)       // → "1,500"
formatAmount(1000500000n)       // → "1,000.5"
formatAmount(1000000000n)       // → "1,000"

// Large amounts
formatAmount(1000000000000n)    // → "1,000,000"
```

**When to use:**
- Displaying amounts in UI components, tables, and summaries
- Render invoice amounts, balances, and transaction totals
- Any user-facing amount display

**Note:** Unlike `fromBaseUnits`, this includes thousand separators for readability.

## Currency Formatting

### `formatNaira(amount)`

Formats numbers as Nigerian Naira currency using the system locale.

**Parameters:**
- `amount` (number): The amount in Naira

**Returns:** `string` — formatted Naira string with symbol and separators

**Examples:**

```typescript
formatNaira(1000)        // → "₦1,000.00"
formatNaira(1500.50)     // → "₦1,500.50"
formatNaira(0)           // → "₦0.00"
```

**When to use:**
- Displaying off-ramp payout amounts in Naira
- Showing converted USDC→Naira values
- Locale-specific currency display for Nigerian users

**Edge cases:**
- Non-finite values (`NaN`, `Infinity`, `-Infinity`) return `"₦0.00"`
- Always displays 2 decimal places per Naira convention

## Address Formatting

### `shortAddress(addr, chars?)`

Truncates long Stellar addresses for compact display.

**Parameters:**
- `addr` (string): The full Stellar address
- `chars` (number, optional): Number of characters to show on each end; defaults to 4

**Returns:** `string` — truncated address or original if already short

**Examples:**

```typescript
const addr = "GAEECBB7C5ODFEWEIWFMXRULHJ6YBTFBHEWFBJQPJ3JZJXHZZMDHDKMU";

shortAddress(addr)        // → "GAEE…HDMU"
shortAddress(addr, 6)     // → "GAEECB…HDKMU"
shortAddress(addr, 3)     // → "GAE…DMU"

// Addresses shorter than the threshold are unchanged
shortAddress("SHORT")     // → "SHORT"
```

**When to use:**
- Displaying addresses in tables and inline text
- Wallet display in headers and transaction details
- Mobile layouts where space is limited

**Note:** The return value should always be treated as display-only; never use it for logic or as an identifier.

## Date Formatting

### `formatDate(unixSeconds)`

Converts Unix timestamps to localized date strings.

**Parameters:**
- `unixSeconds` (bigint | number): Unix timestamp in seconds

**Returns:** `string` — formatted date in locale-specific format

**Examples:**

```typescript
formatDate(1609459200n)   // → "Jan 1, 2021" (US locale)
                          // → "1 janv. 2021" (FR locale)
                          // → "1 de enero de 2021" (ES locale)

// Zero timestamp
formatDate(0n)            // → "—" (em-dash, not a date)
formatDate(0)             // → "—"

// Current time
formatDate(Math.floor(Date.now() / 1000))  // → "Nov 23, 2024" (or current date)
```

**When to use:**
- Displaying invoice creation or payment dates
- Timeline and history views
- Due dates and deadlines

**Edge cases:**
- Zero or falsy timestamps display as an em-dash `"—"` (not a valid date)
- Formatting respects the browser's locale setting
- Always includes year, month, and day (no time)

## Description Handling

### `humanizeDescription(desc?)`

Normalizes invoice descriptions from the contract.

**Parameters:**
- `desc` (string | null | undefined): The description to normalize

**Returns:** `string` — normalized description or empty string

**Examples:**

```typescript
humanizeDescription("Payment for design work")
  // → "Payment for design work"

humanizeDescription(null)
  // → ""

humanizeDescription(undefined)
  // → ""

humanizeDescription("")
  // → ""
```

**Important behavior:**
Descriptions are displayed **exactly as recorded on-chain**. Early demo invoices may carry placeholder text (e.g., `"test invoice from bot"`). The function does **not** reword or clean up descriptions — it preserves the immutable on-chain record.

**When to use:**
- Displaying invoice descriptions in details views
- Rendering invoice titles and notes
- Any user-facing invoice text

**Note:** Because descriptions are immutable on-chain, this function only handles null/undefined cases; it does not modify the text content.

## Common Usage Patterns

### Pattern 1: Display an Invoice Amount

```typescript
import { formatAmount } from "@/lib/format";
import { getInvoice } from "@/lib/contract";

export function InvoiceAmount({ invoiceId }: { invoiceId: number }) {
  const invoice = getInvoice(invoiceId);
  
  // invoice.amount is a bigint in stroops
  const displayAmount = formatAmount(invoice.amount);
  
  return <span>${displayAmount}</span>;
}

// Output: $1,500.5
```

### Pattern 2: Convert User Input for Contract

```typescript
import { toBaseUnits } from "@/lib/format";
import { createInvoice } from "@/lib/contract";

async function handleCreateInvoice(amountInput: string) {
  // User entered "150.5" in a form
  const baseUnits = toBaseUnits(amountInput);
  
  // Send to contract
  const result = await createInvoice({
    amount: baseUnits,
    description: "Web design project",
    // ...
  });
  
  return result;
}
```

### Pattern 3: Display Address Safely

```typescript
import { shortAddress } from "@/lib/format";

export function WalletTag({ publicKey }: { publicKey: string }) {
  return (
    <span title={publicKey}>
      {shortAddress(publicKey, 5)}
    </span>
  );
}

// Displays "GAEEC…MDHDKMU" with tooltip showing full address
```

### Pattern 4: Naira Conversion Display

```typescript
import { fromBaseUnits, formatNaira } from "@/lib/format";
import { NGN_PER_USDC } from "@/lib/config";

export function PayoutPreview({ amountInStroops }: { amountInStroops: bigint }) {
  const usdc = Number(fromBaseUnits(amountInStroops));
  const naira = usdc * NGN_PER_USDC;
  
  return (
    <div>
      <p>USDC: ${usdc.toFixed(2)}</p>
      <p>Naira: {formatNaira(naira)}</p>
    </div>
  );
}

// Output:
// USDC: $500.00
// Naira: ₦780,000.00
```

## Decimal Precision

### Why 7 decimals?

USDC on Stellar is a Stellar Asset Contract (SAC) that wraps the classic USDC-Ares asset. The contract defines its precision as 7 decimal places:

- 1 USDC = 10,000,000 stroops (10^7)
- Smallest unit = 1 stoop = 0.0000001 USDC

**All format functions default to 7 decimals.** If your deployment uses a different token with a different precision, pass it explicitly:

```typescript
// 6-decimal token (like actual mainnet USDC)
toBaseUnits("100", 6)     // → 100000000n
fromBaseUnits(100000000n, 6)  // → "100"
```

## Testing Conversions

Format functions are tested in `web/lib/__tests__/format.test.mjs`. When adding features that use format utilities:

1. **Round-trip test:** Verify that `fromBaseUnits(toBaseUnits(x)) === x` for valid inputs
2. **Consistency:** Ensure `formatAmount` matches the base units from `fromBaseUnits`
3. **Boundaries:** Test with 0, very large numbers, and negative values

## See Also

- **contract.ts** — Working with contract amounts and return values
- **config.ts** — Token configuration including decimals and symbols
- **TESTING.md** — Writing tests for utility functions
- **ARCHITECTURE.md** — System design and data flow

