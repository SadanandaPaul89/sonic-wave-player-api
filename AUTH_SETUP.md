# Authentication Setup

This project supports both Supabase authentication and local development authentication.

## Switching Between Auth Modes

### Local Authentication (Development)
To use local authentication for development:

1. Open `src/config/auth.ts`
2. Set `USE_LOCAL_AUTH = true`
3. Restart your development server

**Features:**
- ✅ No external dependencies
- ✅ Instant sign up/sign in
- ✅ Session persistence in localStorage
- ✅ Mock Google OAuth
- ✅ 24-hour session expiry
- ✅ Development indicator in UI

**Test Credentials:**

**Predefined Test Users:**
- **Test User**: `test@example.com` / `password123`
- **Admin User**: `admin@example.com` / `admin123`
- **Artist User**: `artist@example.com` / `artist123`
- **Demo User**: `demo@sonicwave.com` / `demo123`

**Or create any user:**
- Any email format (e.g., `user@domain.com`)
- Any password (minimum 6 characters)
- Google OAuth simulation works instantly

### Supabase Authentication (Production)
To use Supabase authentication:

1. Open `src/config/auth.ts`
2. Set `USE_LOCAL_AUTH = false`
3. Ensure your Supabase configuration is correct in `src/lib/supabase.ts`
4. Restart your development server

**Features:**
- ✅ Real user authentication
- ✅ Email confirmation
- ✅ Google OAuth integration
- ✅ Secure session management
- ✅ Production ready

## Local Auth Implementation Details

### Session Storage
- Sessions are stored in `localStorage` with key `local_auth_session`
- Sessions expire after 24 hours
- Sessions are automatically cleaned up on expiry

### Mock User Data
```typescript
{
  id: "user_[random]",
  email: "[provided_email]",
  name: "[email_prefix]",
  created_at: "[current_timestamp]"
}
```

### API Compatibility
The local auth service implements the same interface as Supabase auth:
- `signInWithPassword()`
- `signUp()`
- `signInWithOAuth()`
- `getSession()`
- `signOut()`
- `onAuthStateChange()`

## Development Workflow

1. **Start Development**: Use local auth for faster development
2. **Test Features**: All auth-dependent features work with local auth
3. **Pre-Production**: Switch to Supabase auth for final testing
4. **Production**: Deploy with Supabase auth enabled

## Visual Indicators

When local auth is enabled, you'll see:
- 🔧 Development Mode indicator on auth pages
- Console logs showing "Local auth: true"
- Instant authentication without network requests

## Troubleshooting

### Switching Auth Modes
- Always restart your dev server after changing auth modes
- Clear localStorage if you experience session issues: `localStorage.clear()`

### Local Auth Issues
- Check browser console for errors
- Verify `USE_LOCAL_AUTH = true` in `src/config/auth.ts`
- Clear localStorage and try again

### Supabase Auth Issues
- Verify Supabase configuration
- Check network connectivity
- Ensure `USE_LOCAL_AUTH = false`