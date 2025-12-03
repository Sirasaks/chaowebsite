# GaFiwShop API Documentation

> [!IMPORTANT]
> This document contains the complete API documentation for integrating with GaFiwShop (https://gafiwshop.xyz) services. Use this as a reference when implementing integrations with their premium app selling platform.

## Overview

GaFiwShop provides APIs for managing digital product sales, including premium apps like Netflix, YouTube Premium, and other streaming services. The API supports product browsing, purchasing, balance checking, and order history retrieval.

**Base URL:** `https://gafiwshop.xyz/api`

**Authentication:** Most endpoints require an API key (`keyapi`) obtained from your GaFiwShop account.

---

## API Endpoints

### 1. Get Account Balance (ดึงจำนวนเงิน)

Retrieve the current balance of your GaFiwShop account.

**Endpoint:** `POST /api_money`

**Full URL:** `https://gafiwshop.xyz/api/api_money`

**Authentication:** Required

#### Request Parameters

| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| `keyapi`  | string | Yes      | Your API key          |

#### Request Example

```http
POST https://gafiwshop.xyz/api/api_money
Content-Type: application/x-www-form-urlencoded

keyapi=YOUR_API_KEY_HERE
```

#### Response Example

```json
{
  "ok": true,
  "balance": "20.94",
  "owner": "zotangx2"
}
```

#### Response Fields

| Field     | Type    | Description                    |
|-----------|---------|--------------------------------|
| `ok`      | boolean | Request status                 |
| `balance` | string  | Current account balance (THB)  |
| `owner`   | string  | Account owner username         |

---

### 2. Get Products - Public (ดึงสินค้า สาธารณะ)

Retrieve a list of all available products. This is a public endpoint that does not require authentication.

**Endpoint:** `GET /api_product`

**Full URL:** `https://gafiwshop.xyz/api/api_product`

**Authentication:** Not required

#### Request Parameters

None

#### Request Example

```http
GET https://gafiwshop.xyz/api/api_product
```

#### Response Example

```json
{
  "ok": true,
  "count": 2,
  "data": [
    {
      "name": "Netflix Premium UHD 4K",
      "imageapi": "https://example.com/netflix.png",
      "details": "Netflix Premium account with 4K streaming",
      "price": "100",
      "pricevip": "90",
      "stock": "25",
      "type_menu": "แอพพรีเมี่ยม",
      "type_id": "P001"
    },
    {
      "name": "YouTube Premium",
      "imageapi": "https://example.com/youtube.png",
      "details": "YouTube Premium subscription",
      "price": "200",
      "pricevip": "180",
      "stock": "0",
      "type_menu": "แอพพรีเมี่ยม",
      "type_id": "P002"
    }
  ]
}
```

#### Response Fields

| Field   | Type    | Description                      |
|---------|---------|----------------------------------|
| `ok`    | boolean | Request status                   |
| `count` | number  | Total number of products         |
| `data`  | array   | Array of product objects         |

#### Product Object Fields

| Field        | Type   | Description                                    |
|--------------|--------|------------------------------------------------|
| `name`       | string | Product name                                   |
| `imageapi`   | string | Product image URL                              |
| `details`    | string | Product description and details                |
| `price`      | string | Regular price (THB)                            |
| `pricevip`   | string | VIP/discounted price (THB)                     |
| `stock`      | string | Available stock quantity ("0" = out of stock)  |
| `type_menu`  | string | Product category/menu type                     |
| `type_id`    | string | Unique product identifier (use for purchasing) |

---

### 3. Buy Product (ซื้อสินค้า)

Purchase a product using your account balance.

**Endpoint:** `POST /api_buy`

**Full URL:** `https://gafiwshop.xyz/api/api_buy`

**Authentication:** Required

#### Request Parameters

| Parameter      | Type   | Required | Description                                    |
|----------------|--------|----------|------------------------------------------------|
| `keyapi`       | string | Yes      | Your API key                                   |
| `type_id`      | string | Yes      | Product ID (from Get Products response)        |
| `username_buy` | string | No       | Optional username to associate with purchase   |

#### Request Example

```http
POST https://gafiwshop.xyz/api/api_buy
Content-Type: application/x-www-form-urlencoded

keyapi=YOUR_API_KEY_HERE&type_id=P001&username_buy=customer123
```

#### Success Response Example

```json
{
  "ok": true,
  "status": "success",
  "message": "ซื้อสินค้าสำเร็จ",
  "data": {
    "uid": 12345,
    "name": "Netflix Premium UHD 4K",
    "imageapi": "https://example.com/netflix.png",
    "textdb": "Account: user@example.com\nPassword: pass123\nProfile: Profile 1",
    "point": 100,
    "date": "2025/11/25 05:49:20"
  }
}
```

#### Error Response Example

```json
{
  "ok": false,
  "status": "error",
  "message": "สินค้าหมด หรือ ยอดเงินไม่พอ"
}
```

#### Response Fields (Success)

| Field     | Type    | Description                    |
|-----------|---------|--------------------------------|
| `ok`      | boolean | Request status                 |
| `status`  | string  | "success" or "error"           |
| `message` | string  | Status message in Thai         |
| `data`    | object  | Purchase details (on success)  |

#### Purchase Data Object Fields

| Field      | Type   | Description                                  |
|------------|--------|----------------------------------------------|
| `uid`      | number | Unique order/transaction ID                  |
| `name`     | string | Product name                                 |
| `imageapi` | string | Product image URL                            |
| `textdb`   | string | Product credentials/details (account info)   |
| `point`    | number | Points/price deducted                        |
| `date`     | string | Purchase date and time (YYYY/MM/DD HH:MM:SS) |

---

### 4. Get Order History (ดึงประวัติสั่งซื้อ)

Retrieve purchase history from your account.

**Endpoint:** `GET /api_history`

**Full URL:** `https://gafiwshop.xyz/api/api_history`

**Authentication:** Required

#### Request Parameters

| Parameter      | Type   | Required | Description                                        |
|----------------|--------|----------|----------------------------------------------------|
| `keyapi`       | string | Yes      | Your API key                                       |
| `username_buy` | string | No       | Filter by username (optional)                      |
| `limit`        | string | No       | "all" or number (default: 1000, max records)       |

#### Request Example

```http
GET https://gafiwshop.xyz/api/api_history?keyapi=YOUR_API_KEY_HERE&limit=all
```

With username filter:
```http
GET https://gafiwshop.xyz/api/api_history?keyapi=YOUR_API_KEY_HERE&username_buy=customer123&limit=50
```

#### Response Example

```json
{
  "ok": true,
  "ref": "JPWhRcpOHkc6XhQ8ZbTK",
  "owner": "zotangx2",
  "username_buy": "ลูกค้าA",
  "limit": 1000,
  "count": 2,
  "data": [
    {
      "id": "101",
      "name": "(API) Netflix Premium UHD 4K",
      "image": "https://example.com/netflix.png",
      "details": "Account: user@example.com\nPassword: pass123",
      "price": "100",
      "date": "2025/08/29 12:34:56",
      "type": "แอพพรีเมี่ยม"
    },
    {
      "id": "100",
      "name": "(API) YouTube Premium",
      "image": "https://example.com/youtube.png",
      "details": "Account: yt@example.com\nPassword: yt123",
      "price": "180",
      "date": "2025/08/29 11:00:00",
      "type": "แอพพรีเมี่ยม"
    }
  ]
}
```

#### Response Fields

| Field          | Type    | Description                           |
|----------------|---------|---------------------------------------|
| `ok`           | boolean | Request status                        |
| `ref`          | string  | Reference ID for this query           |
| `owner`        | string  | Account owner username                |
| `username_buy` | string  | Filtered username (if provided)       |
| `limit`        | number  | Maximum records returned              |
| `count`        | number  | Actual number of records returned     |
| `data`         | array   | Array of order objects                |

#### Order Object Fields

| Field     | Type   | Description                                  |
|-----------|--------|----------------------------------------------|
| `id`      | string | Unique order ID                              |
| `name`    | string | Product name (prefixed with "(API)")         |
| `image`   | string | Product image URL                            |
| `details` | string | Product credentials/account information      |
| `price`   | string | Price paid (THB)                             |
| `date`    | string | Purchase date and time (YYYY/MM/DD HH:MM:SS) |
| `type`    | string | Product category/type                        |

---

## Integration Examples

### PHP Example Files

GaFiwShop provides sample PHP files for integration:

- **Get Products:** [api_product.zip](https://gafiwshop.xyz/upload/api_product.zip)
- **Buy Product:** [buy.zip](https://gafiwshop.xyz/upload/buy.zip)
- **Order History:** [history.zip](https://gafiwshop.xyz/upload/history.zip)
- **Widget - Recent Orders:** [history_gafiw.zip](https://gafiwshop.xyz/upload/history_gafiw.zip)

### JavaScript/TypeScript Example

```typescript
// GaFiwShop API Client Example

interface GaFiwProduct {
  name: string;
  imageapi: string;
  details: string;
  price: string;
  pricevip: string;
  stock: string;
  type_menu: string;
  type_id: string;
}

interface GaFiwOrder {
  uid: number;
  name: string;
  imageapi: string;
  textdb: string;
  point: number;
  date: string;
}

class GaFiwShopAPI {
  private apiKey: string;
  private baseURL = 'https://gafiwshop.xyz/api';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Get account balance
  async getBalance(): Promise<{ balance: string; owner: string }> {
    const response = await fetch(`${this.baseURL}/api_money`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `keyapi=${this.apiKey}`
    });
    const data = await response.json();
    if (!data.ok) throw new Error('Failed to fetch balance');
    return { balance: data.balance, owner: data.owner };
  }

  // Get all products (public, no auth required)
  async getProducts(): Promise<GaFiwProduct[]> {
    const response = await fetch(`${this.baseURL}/api_product`);
    const data = await response.json();
    if (!data.ok) throw new Error('Failed to fetch products');
    return data.data;
  }

  // Buy a product
  async buyProduct(
    typeId: string, 
    usernameBuy?: string
  ): Promise<GaFiwOrder> {
    const params = new URLSearchParams({
      keyapi: this.apiKey,
      type_id: typeId
    });
    
    if (usernameBuy) {
      params.append('username_buy', usernameBuy);
    }

    const response = await fetch(`${this.baseURL}/api_buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    
    const data = await response.json();
    
    if (!data.ok || data.status !== 'success') {
      throw new Error(data.message || 'Failed to purchase product');
    }
    
    return data.data;
  }

  // Get order history
  async getOrderHistory(
    usernameBuy?: string, 
    limit: string | number = 1000
  ): Promise<any[]> {
    const params = new URLSearchParams({
      keyapi: this.apiKey,
      limit: limit.toString()
    });
    
    if (usernameBuy) {
      params.append('username_buy', usernameBuy);
    }

    const response = await fetch(
      `${this.baseURL}/api_history?${params.toString()}`
    );
    
    const data = await response.json();
    if (!data.ok) throw new Error('Failed to fetch order history');
    return data.data;
  }
}

// Usage Example
const client = new GaFiwShopAPI('YOUR_API_KEY_HERE');

// Get products
const products = await client.getProducts();
console.log('Available products:', products);

// Check balance
const { balance, owner } = await client.getBalance();
console.log(`Balance: ${balance} THB (Owner: ${owner})`);

// Buy a product
const order = await client.buyProduct('P001', 'customer123');
console.log('Purchase successful:', order.textdb);

// Get order history
const history = await client.getOrderHistory('customer123', 10);
console.log('Recent orders:', history);
```

---

## Error Handling

All API responses include an `ok` field indicating success/failure:

- **Success:** `{ "ok": true, ... }`
- **Failure:** `{ "ok": false, "message": "error description" }`

### Common Error Messages

| Error Message (Thai)           | English Translation                    | Cause                                |
|-------------------------------|----------------------------------------|--------------------------------------|
| สินค้าหมด                      | Product out of stock                   | `stock` is "0"                       |
| ยอดเงินไม่พอ                   | Insufficient balance                   | Balance < product price              |
| ซื้อสินค้าสำเร็จ               | Purchase successful                    | Success message                      |
| API Key ไม่ถูกต้อง             | Invalid API key                        | Incorrect or missing `keyapi`        |

---

## Best Practices

1. **Stock Checking:** Always check `stock` field before attempting to purchase
2. **Balance Verification:** Verify sufficient balance using `/api_money` before purchases
3. **Error Handling:** Implement proper try-catch blocks and handle Thai error messages
4. **Rate Limiting:** Implement reasonable request delays to avoid overwhelming the server
5. **API Key Security:** Never expose your API key in client-side code or public repositories
6. **Real-time Stock:** Call `/api_product` frequently to get real-time stock availability
7. **Username Tracking:** Use `username_buy` parameter to track purchases per customer

---

## Product Categories

Common product types available on GaFiwShop:

- **แอพพรีเมี่ยม** (Premium Apps)
  - Netflix (various tiers)
  - YouTube Premium
  - Spotify Premium
  - Disney+
  - HBO GO
  - VIU, WeTV, iQIYI
  - True ID, AIS Play
  - Prime Video

- **เมล์ / แอคเคาท์** (Email/Accounts)
  - Game accounts
  - Email accounts

- **เบอร์ OTP** (OTP Numbers)
  - Temporary phone numbers for verification

- **ปั้มไลค์ / ติดตาม** (Social Media Services)
  - Followers, likes, views boosting

---

## Contact & Support

- **Website:** https://gafiwshop.xyz
- **Line ID:** @483fzmiw
- **Email:** [email protected]
- **Business Hours:**
  - Mon-Fri: 15:00 – 03:00
  - Sat-Sun: 10:00 – 00:00

---

## API Reference Quick Links

- Get Balance: `POST https://gafiwshop.xyz/api/api_money`
- Get Products: `GET https://gafiwshop.xyz/api/api_product`
- Buy Product: `POST https://gafiwshop.xyz/api/api_buy`
- Order History: `GET https://gafiwshop.xyz/api/api_history`

---

## Notes for AI Assistants

When implementing GaFiwShop API integration:

1. Use the TypeScript example code as a starting point
2. All prices are in Thai Baht (THB)
3. Stock values are strings ("0" to "999+")
4. Product credentials are returned in `textdb` field after purchase
5. Date format is always `YYYY/MM/DD HH:MM:SS`
6. API responses may contain Thai language messages
7. The `pricevip` field is the VIP/discounted price - use this for display if user has VIP status
8. Products with `stock: "0"` should be marked as "Out of Stock" or disabled
9. The `type_id` is the unique identifier needed for purchasing
10. Order history items are prefixed with "(API)" to indicate API purchases

---

*Last Updated: 2025-11-25*
*Document Version: 1.0*
