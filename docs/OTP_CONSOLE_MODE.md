# OTP Console Mode - Development Guide

## Overview

The OTP service now supports a **console mode** for development, where OTPs and email notifications are logged to the terminal instead of being sent via email.

## Configuration

### Environment Variable

Add this to your `.env` file:

```bash
# OTP Configuration
# Options: 'email' (production) or 'console' (development)
OTP_MODE=console
```

### Modes

#### Console Mode (Development)

- **Value**: `OTP_MODE=console`
- **Behavior**: All OTPs and notifications are logged to the terminal
- **Use Case**: Local development and testing
- **Benefits**:
  - No need for email credentials
  - Instant OTP visibility
  - No email delivery delays
  - Easy debugging

#### Email Mode (Production)

- **Value**: `OTP_MODE=email` (or omit the variable)
- **Behavior**: OTPs are sent via configured SMTP server
- **Use Case**: Production and staging environments
- **Requirements**: Valid SMTP configuration in `.env`

## Example Output

When `OTP_MODE=console`, you'll see formatted output in your terminal:

```
============================================================
📧 OTP EMAIL (Development Mode)
============================================================
To: user@example.com
Purpose: registration
Code: 123456
============================================================
```

## What Gets Logged

1. **OTP Emails** - Verification codes for registration, login, password reset
2. **Admin Request Notifications** - When users request admin access
3. **Admin Approval Notifications** - When admin access is granted

## Switching Modes

### For Development

```bash
OTP_MODE=console
```

### For Production

```bash
OTP_MODE=email
# OR simply remove the OTP_MODE line
```

## Testing

To test the OTP console mode:

1. Set `OTP_MODE=console` in `.env`
2. Start your server: `npm run dev`
3. Trigger an OTP action (e.g., user registration)
4. Check your terminal for the formatted OTP output
5. Copy the code and use it in your API request

## Important Notes

- ⚠️ **Never use console mode in production** - Always use email mode for production deployments
- 📧 Console mode bypasses all email sending logic, so SMTP credentials are not required
- 🔒 OTPs are still securely hashed in the database regardless of mode
- ⏱️ OTP expiry and attempt limits still apply in console mode
