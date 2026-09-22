# 🔐 Environment Variables Setup

## Security Best Practices

This app uses **backend-only environment variables** to keep your sensitive data secure and hack-proof.

## How It Works

1. **Backend-Only Storage**: Sensitive keys are ONLY stored on the backend
2. **Never in Client Code**: These keys are never exposed to the React Native app bundle
3. **Validation**: All environment variables are validated with Zod schemas
4. **Git-Ignored**: The `.env` file is automatically ignored by Git
5. **Encrypted at Rest**: When stored locally, they should be kept on a secure machine

## Setup Instructions

### Step 1: Create .env File in Project Root

Create a file named `.env` in your project root (same directory as `package.json`):

```bash
touch .env
```

### Step 2: Copy Template and Fill Values

Copy the content from `env.example` to `.env` and replace all the placeholder values with your actual keys.

**Important**: Store your `.env` file on your desktop or secure location. You can keep it backed up securely and copy it to your project root when needed.

### Step 3: Verify Setup

The app will automatically validate your environment variables on startup. If something is missing, you'll see an error message.

## Available Environment Variables

### Required
- `OPENAI_API_KEY` - For AI predictions, chatbot, and advanced analytics
- `OPENAI_MODEL` - Default: gpt-4o

### Database (Optional)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key for client access
- `SUPABASE_SERVICE_KEY` - Supabase service role key (backend only)
- `SUPABASE_JWT_SECRET` - JWT secret for token validation

### AI Predictions (Optional)
- `PREDICTION_API_URL` - Custom prediction API endpoint
- `PREDICTION_API_KEY` - API key for predictions

### Vector Database & LangChain (Optional)
- `VECTOR_DB_URL` - Vector database endpoint
- `VECTOR_DB_API_KEY` - Vector database authentication
- `LANGCHAIN_API_KEY` - LangChain API key
- `EMBEDDING_MODEL` - Default: text-embedding-3-large

### Pinecone (Optional)
- `PINECONE_API_KEY` - Pinecone vector database key
- `PINECONE_INDEX_NAME` - Your Pinecone index name

### Subscriptions & Payments (Optional)
- `APPLE_SHARED_SECRET` - Apple In-App Purchase validation
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` - Google Play service account
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification

### Push Notifications (Optional)
- `FIREBASE_SERVER_KEY` - Firebase Cloud Messaging
- `FIREBASE_SENDER_ID` - Firebase sender ID
- `FIREBASE_API_KEY` - Firebase API key
- `APNS_KEY_ID` - Apple Push Notification service key ID
- `APNS_TEAM_ID` - Apple team ID
- `APNS_AUTH_KEY` - APNS authentication key

### Analytics & Monitoring (Optional)
- `SENTRY_DSN` - Sentry error tracking
- `MIXPANEL_TOKEN` - Mixpanel analytics

## Security Features

✅ **Git-Ignored**: `.env` is in `.gitignore` and will never be committed
✅ **Backend-Only**: Keys are only accessible in backend code (`backend/` folder)
✅ **Type-Safe**: Validated with Zod schemas
✅ **No Client Exposure**: Client can never access these keys directly
✅ **Secure Storage**: Keep your .env file on your desktop/secure location

## Using Environment Variables

### In Backend Code (tRPC routes, Hono handlers)

```typescript
import { env } from "@/backend/config/env";

// Use the validated environment variables
const apiKey = env.OPENAI_API_KEY;
const model = env.OPENAI_MODEL;
const supabaseUrl = env.SUPABASE_URL;
```

### ⚠️ NEVER Do This

```typescript
// ❌ DON'T: Use process.env directly in backend
const key = process.env.OPENAI_API_KEY;

// ❌ DON'T: Try to access in client code
// This will be undefined/empty in React Native
const key = process.env.OPENAI_API_KEY;
```

## Removed Features

The following AI features have been temporarily removed to prevent ngrok timeout errors:
- AI-powered cycle predictions on dashboard (now using local algorithm)
- Real-time AI analysis

These features can be re-enabled once you add your keys to the `.env` file.

## Troubleshooting

### "Missing required environment variables" error

Make sure:
1. You created a `.env` file in the project root
2. You added `OPENAI_API_KEY=your_actual_key` to the file
3. You restarted the development server
4. There are no spaces around the `=` sign

### Keys not being loaded

- Check that `.env` is in the project root (same folder as `package.json`)
- Make sure there are no spaces around the `=` sign
- Make sure there are no quotes around values (unless part of the value)
- Restart the Expo server after adding/changing variables

### Preview showing "Making changes..."

This is usually caused by:
- Backend trying to access env variables that don't exist
- API timeouts (especially with AI features)
- The server needs a restart after env changes

**Solution**: 
1. Stop the development server
2. Verify your `.env` file exists and has correct values
3. Restart the server with `bun start` or `npm start`

## For Production

When deploying to production, add environment variables through your hosting platform's dashboard:
- **Vercel**: Project Settings → Environment Variables
- **Heroku**: Config Vars
- **AWS**: Parameter Store / Secrets Manager
- **Railway**: Variables tab
- **Render**: Environment Variables

## Backing Up Your .env

Since you're storing this on your desktop:

1. **Keep a secure backup** of your `.env` file
2. **Don't email or message** the file
3. **Use a password manager** or encrypted storage
4. **When deploying**, use platform-specific secret management

**Never commit your `.env` file to version control!**

## Quick Setup Checklist

- [ ] Copy `env.example` to `.env`
- [ ] Add your `OPENAI_API_KEY`
- [ ] Add any other keys you have
- [ ] Save `.env` to your desktop as backup
- [ ] Copy `.env` to project root
- [ ] Restart development server
- [ ] Verify app loads without errors
