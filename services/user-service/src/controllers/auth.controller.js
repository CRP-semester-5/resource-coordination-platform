import * as authService from '../services/auth.service.js'

/**
 * POST /api/v1/auth/register
 * Body: { first_name, last_name, email, password }  [validated by Joi]
 * Response 201: { message, userId }
 */
export async function register(req, res, next) {
    try {
        const { first_name, last_name, email, phone, password } = req.body

        const user = await authService.register({
            firstName: first_name,
            lastName: last_name,
            email,
            phone,
            password,
        })

        return res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            userId: user.user_id,
        })
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/v1/auth/login
 * Body: { email, password }  [validated by Joi]
 * Response 200: { token, userId, roles }
 */
export async function login(req, res, next) {
    try {
        const { email, password } = req.body
        const result = await authService.login({ email, password })
        return res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/v1/auth/verify-email
 * Body: { token }  [validated by Joi]
 * Response 200: { message }
 */
export async function verifyEmail(req, res, next) {
    try {
        await authService.verifyEmail(req.body.token)
        return res.status(200).json({ message: 'Email verified successfully. You can now log in.' })
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/v1/auth/verify-email?token=<hex>
 *
 * Handles clicks from the verification email link.
 * When there is no frontend yet (FRONTEND_URL not reachable), this endpoint
 * verifies the token and returns a plain HTML confirmation page directly.
 * Once the frontend is live, update FRONTEND_URL and the GET route can redirect.
 */
export async function verifyEmailGet(req, res, next) {
    const { token } = req.query

    if (!token || token.length !== 64) {
        return res.status(400).send(htmlPage(
            '❌ Invalid Link',
            'The verification link is invalid or incomplete.',
            '#e53e3e'
        ))
    }

    try {
        await authService.verifyEmail(token)
        return res.send(htmlPage(
            '✅ Email Verified!',
            'Your account has been activated. You can now log in to ResQ Hub.',
            '#38a169'
        ))
    } catch (err) {
        return res.status(400).send(htmlPage(
            '❌ Verification Failed',
            err.message || 'The link may have expired or already been used. Please register again.',
            '#e53e3e'
        ))
    }
}

function htmlPage(title, body, color) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — ResQ Hub</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           min-height: 100vh; display: flex; align-items: center; justify-content: center;
           background: #f7fafc; }
    .card { background: #fff; border-radius: 12px; padding: 48px 40px;
            max-width: 440px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,.08);
            text-align: center; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    h1 { font-size: 24px; font-weight: 700; color: ${color}; margin-bottom: 12px; }
    p { color: #4a5568; line-height: 1.6; margin-bottom: 28px; }
    a { display: inline-block; padding: 12px 28px; background: ${color};
        color: #fff; text-decoration: none; border-radius: 8px;
        font-weight: 600; font-size: 15px; }
    .brand { margin-top: 32px; color: #a0aec0; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${color === '#38a169' ? '🛡️' : '⚠️'}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <a href="http://localhost:5173">Go to ResQ Hub</a>
    <p class="brand">ResQ Hub — Community Resilience Platform</p>
  </div>
</body>
</html>`
}



/**
 * POST /api/v1/auth/forgot-password
 * Body: { email }  [validated by Joi]
 * Response 200: { message }  (always the same — no user enumeration)
 */
export async function forgotPassword(req, res, next) {
    try {
        const result = await authService.forgotPassword(req.body.email)
        return res.status(200).json(result)
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/v1/auth/reset-password
 * Body: { token, password }  [validated by Joi]
 * Response 200: { message }
 */
export async function resetPassword(req, res, next) {
    try {
        await authService.resetPassword(req.body.token, req.body.password)
        return res.status(200).json({ message: 'Password has been reset successfully.' })
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/v1/auth/logout
 * Headers: Authorization: Bearer <token>
 * Response 200: { message }
 *
 * JWTs are stateless — the client is responsible for discarding the token.
 * This endpoint confirms logout to the client. For token blacklisting,
 * a Redis-backed approach would be added here in a future iteration.
 */
export async function logout(req, res) {
    return res.status(200).json({ message: 'Logged out successfully.' })
}
