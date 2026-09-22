# Shop/E-Commerce API Integration Guide

This document provides integration points for adding a product shop to F365 (wellness products, supplements, period care, etc.).

---

## Current Status

**Shop feature does NOT exist yet.** This document provides the architecture and integration points for when you're ready to add e-commerce functionality.

---

## Recommended Architecture

### Files to Create

| File | Purpose |
|------|---------|
| `types/shop.ts` | Product, Cart, Order type definitions |
| `store/shop-store.ts` | State management for products and cart |
| `app/shop/index.tsx` | Product listing page |
| `app/shop/[productId].tsx` | Product detail page |
| `app/shop/cart.tsx` | Shopping cart page |
| `app/shop/checkout.tsx` | Checkout flow |
| `app/shop/orders.tsx` | Order history |
| `components/ProductCard.tsx` | Reusable product card component |

---

## Type Definitions

Create `types/shop.ts`:

```typescript
export type ProductCategory = 
  | 'supplements'
  | 'period_care'
  | 'wellness'
  | 'skincare'
  | 'books'
  | 'accessories';

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number; // Original price if on sale
  currency: string;
  images: string[];
  inStock: boolean;
  stockQuantity?: number;
  sku: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  isPremiumOnly?: boolean; // Only available to premium subscribers
  variants?: ProductVariant[];
  metadata?: Record<string, any>;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "30 count", "60 count"
  price: number;
  sku: string;
  inStock: boolean;
  stockQuantity?: number;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  product: Product; // Denormalized for display
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
```

---

## Store Implementation

Create `store/shop-store.ts`:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, CartItem, Cart, Order, ShippingAddress } from '@/types/shop';

interface ShopState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  isLoading: boolean;
  
  // Product actions
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  getProduct: (productId: string) => Promise<Product | null>;
  
  // Cart actions
  addToCart: (product: Product, quantity?: number, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getCartTotal: () => Cart;
  
  // Order actions
  createOrder: (shippingAddress: ShippingAddress, paymentMethodId: string) => Promise<Order>;
  fetchOrders: () => Promise<void>;
  getOrder: (orderId: string) => Promise<Order | null>;
}

interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      products: [],
      cart: [],
      orders: [],
      isLoading: false,
      
      // ============================================
      // PRODUCT ACTIONS - Replace with real API
      // ============================================
      
      fetchProducts: async (filters?: ProductFilters) => {
        set({ isLoading: true });
        try {
          // TODO: Replace with real API call
          // const response = await fetch(`${SHOP_API_BASE}/products`, {
          //   method: 'GET',
          //   headers: { 'Authorization': `Bearer ${API_KEY}` },
          // });
          // const products = await response.json();
          
          // MOCK: Return empty array until API connected
          const products: Product[] = [];
          set({ products, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch products:', error);
          set({ isLoading: false });
        }
      },
      
      getProduct: async (productId: string) => {
        try {
          // TODO: Replace with real API call
          // const response = await fetch(`${SHOP_API_BASE}/products/${productId}`);
          // return await response.json();
          
          return get().products.find(p => p.id === productId) || null;
        } catch (error) {
          console.error('Failed to get product:', error);
          return null;
        }
      },
      
      // ============================================
      // CART ACTIONS - Local state (can sync to API)
      // ============================================
      
      addToCart: (product: Product, quantity = 1, variantId?: string) => {
        set((state) => {
          const existingIndex = state.cart.findIndex(
            item => item.productId === product.id && item.variantId === variantId
          );
          
          if (existingIndex >= 0) {
            const newCart = [...state.cart];
            newCart[existingIndex].quantity += quantity;
            return { cart: newCart };
          }
          
          return {
            cart: [...state.cart, { productId: product.id, variantId, quantity, product }],
          };
        });
      },
      
      removeFromCart: (productId: string, variantId?: string) => {
        set((state) => ({
          cart: state.cart.filter(
            item => !(item.productId === productId && item.variantId === variantId)
          ),
        }));
      },
      
      updateQuantity: (productId: string, quantity: number, variantId?: string) => {
        if (quantity <= 0) {
          get().removeFromCart(productId, variantId);
          return;
        }
        
        set((state) => ({
          cart: state.cart.map(item =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item
          ),
        }));
      },
      
      clearCart: () => set({ cart: [] }),
      
      getCartTotal: () => {
        const cart = get().cart;
        const subtotal = cart.reduce((sum, item) => {
          const variant = item.product.variants?.find(v => v.id === item.variantId);
          const price = variant?.price || item.product.price;
          return sum + (price * item.quantity);
        }, 0);
        
        const tax = subtotal * 0.08; // 8% tax - adjust as needed
        const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
        
        return {
          items: cart,
          subtotal,
          tax,
          shipping,
          total: subtotal + tax + shipping,
          currency: 'USD',
        };
      },
      
      // ============================================
      // ORDER ACTIONS - Replace with real API
      // ============================================
      
      createOrder: async (shippingAddress: ShippingAddress, paymentMethodId: string) => {
        const cartTotal = get().getCartTotal();
        
        try {
          // TODO: Replace with real API call
          // const response = await fetch(`${SHOP_API_BASE}/orders`, {
          //   method: 'POST',
          //   headers: {
          //     'Authorization': `Bearer ${API_KEY}`,
          //     'Content-Type': 'application/json',
          //   },
          //   body: JSON.stringify({
          //     items: cartTotal.items,
          //     shippingAddress,
          //     paymentMethodId,
          //   }),
          // });
          // const order = await response.json();
          
          // MOCK: Create local order
          const order: Order = {
            id: `order_${Date.now()}`,
            orderNumber: `F365-${Date.now().toString().slice(-6)}`,
            items: cartTotal.items,
            subtotal: cartTotal.subtotal,
            tax: cartTotal.tax,
            shipping: cartTotal.shipping,
            total: cartTotal.total,
            currency: cartTotal.currency,
            status: 'confirmed',
            shippingAddress,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          set((state) => ({
            orders: [...state.orders, order],
            cart: [], // Clear cart after order
          }));
          
          return order;
        } catch (error) {
          console.error('Failed to create order:', error);
          throw error;
        }
      },
      
      fetchOrders: async () => {
        set({ isLoading: true });
        try {
          // TODO: Replace with real API call
          // const response = await fetch(`${SHOP_API_BASE}/orders/me`);
          // const orders = await response.json();
          // set({ orders, isLoading: false });
          
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to fetch orders:', error);
          set({ isLoading: false });
        }
      },
      
      getOrder: async (orderId: string) => {
        try {
          // TODO: Replace with real API call
          return get().orders.find(o => o.id === orderId) || null;
        } catch (error) {
          console.error('Failed to get order:', error);
          return null;
        }
      },
    }),
    {
      name: 'flow-365-shop-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ cart: state.cart, orders: state.orders }),
    }
  )
);
```

---

## API Endpoints Reference

### Products API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/products` | GET | List all products (with filters) |
| `/products/{id}` | GET | Get single product |
| `/products/categories` | GET | List all categories |
| `/products/search?q={query}` | GET | Search products |

**GET /products Query Parameters:**
```
?category=supplements
&search=vitamin
&min_price=10
&max_price=50
&in_stock=true
&sort=price_asc|price_desc|rating|newest
&page=1
&limit=20
```

### Cart API (Optional - for server-side cart)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cart` | GET | Get current cart |
| `/cart/items` | POST | Add item to cart |
| `/cart/items/{itemId}` | PUT | Update quantity |
| `/cart/items/{itemId}` | DELETE | Remove item |
| `/cart/clear` | DELETE | Clear entire cart |

### Orders API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/orders` | POST | Create new order |
| `/orders` | GET | List user's orders |
| `/orders/{id}` | GET | Get order details |
| `/orders/{id}/cancel` | POST | Cancel order |

---

## Payment Integration

Use the existing Stripe integration for payments:

```typescript
// In checkout.tsx
import { useStripe } from '@stripe/stripe-react-native';

const handleCheckout = async () => {
  const { createPaymentMethod, confirmPayment } = useStripe();
  
  // 1. Create payment intent on your backend
  const { clientSecret } = await createPaymentIntent({
    amount: cartTotal.total * 100, // Cents
    currency: 'usd',
    metadata: {
      orderType: 'shop_order',
      items: JSON.stringify(cart.map(i => i.productId)),
    },
  });
  
  // 2. Confirm payment
  const { error, paymentIntent } = await confirmPayment(clientSecret, {
    paymentMethodType: 'Card',
  });
  
  if (error) {
    Alert.alert('Payment Failed', error.message);
    return;
  }
  
  // 3. Create order
  const order = await createOrder(shippingAddress, paymentIntent.id);
  
  // 4. Navigate to confirmation
  router.push(`/shop/order-confirmation?orderId=${order.id}`);
};
```

---

## Third-Party E-Commerce Platforms

### Headless Commerce Providers

| Provider | Best For | Integration |
|----------|----------|-------------|
| [Shopify Storefront API](https://shopify.dev/api/storefront) | Full e-commerce, dropshipping | GraphQL API |
| [Medusa](https://medusajs.com/) | Open-source, customizable | REST API |
| [Saleor](https://saleor.io/) | Open-source, GraphQL | GraphQL API |
| [Commerce.js](https://commercejs.com/) | Simple integration | REST API |
| [BigCommerce](https://developer.bigcommerce.com/) | Enterprise scale | REST API |

### Dropshipping/Fulfillment

| Provider | Products | Notes |
|----------|----------|-------|
| [Printful](https://www.printful.com/api) | Custom merchandise | Print-on-demand |
| [Spocket](https://www.spocket.co/) | General products | Dropshipping |
| [Oberlo](https://www.oberlo.com/) | AliExpress products | Shopify integration |

---

## Shopify Integration Example

If using Shopify as your backend:

```typescript
// lib/shopify.ts
const SHOPIFY_DOMAIN = 'your-store.myshopify.com';
const STOREFRONT_TOKEN = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

export const shopifyFetch = async (query: string, variables?: Record<string, any>) => {
  const response = await fetch(
    `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN!,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
  
  return response.json();
};

// Fetch products
export const getProducts = async () => {
  const query = `
    query Products {
      products(first: 20) {
        edges {
          node {
            id
            title
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 5) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;
  
  const { data } = await shopifyFetch(query);
  return data.products.edges.map((edge: any) => edge.node);
};
```

---

## Environment Variables Required

```bash
# Shop API Configuration
EXPO_PUBLIC_SHOP_API_BASE=https://api.your-shop-provider.com/v1
EXPO_PUBLIC_SHOP_API_KEY=your_api_key_here

# If using Shopify
EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_token
EXPO_PUBLIC_SHOPIFY_DOMAIN=your-store.myshopify.com

# Stripe (already configured)
# STRIPE_SECRET_KEY - for payment processing
# EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY - for client
```

---

## Premium Gating for Products

Some products can be premium-only:

```typescript
// In ProductCard.tsx
const ProductCard = ({ product }: { product: Product }) => {
  const { getSubscriptionInfo } = useSubscriptionStore();
  const { isPro } = getSubscriptionInfo();
  
  const handleAddToCart = () => {
    if (product.isPremiumOnly && !isPro) {
      router.push('/subscription');
      return;
    }
    addToCart(product);
  };
  
  return (
    <TouchableOpacity onPress={handleAddToCart}>
      {product.isPremiumOnly && (
        <View style={styles.premiumBadge}>
          <Text>Premium Only</Text>
        </View>
      )}
      {/* ... rest of card */}
    </TouchableOpacity>
  );
};
```

---

## Checklist for Implementation

### Phase 1: Basic Shop UI
- [ ] Create `types/shop.ts`
- [ ] Create `store/shop-store.ts`
- [ ] Create `app/shop/index.tsx` (product listing)
- [ ] Create `app/shop/[productId].tsx` (product detail)
- [ ] Create `components/ProductCard.tsx`
- [ ] Add shop navigation to app

### Phase 2: Cart & Checkout
- [ ] Create `app/shop/cart.tsx`
- [ ] Create `app/shop/checkout.tsx`
- [ ] Integrate with Stripe for payments
- [ ] Add shipping address form

### Phase 3: API Integration
- [ ] Choose e-commerce provider
- [ ] Replace mock data with API calls
- [ ] Implement order creation API
- [ ] Add order tracking

### Phase 4: Polish
- [ ] Add order history (`app/shop/orders.tsx`)
- [ ] Add product reviews
- [ ] Add wishlist functionality
- [ ] Add premium product gating

---

## Support

For questions about this integration, contact the development team or refer to the specific e-commerce provider's documentation.
