# Server-side payment functions

This folder is reserved for server-side payment integration. No live payment endpoint is included in this starter.

Before adding one, verify the current ZapUPI merchant API, webhook signature validation, request format, and credentials from official documentation. Store all secrets as Netlify environment variables without a `VITE_` prefix. Never trust a browser redirect alone as proof of payment.
