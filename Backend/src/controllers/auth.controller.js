import * as authService from '../services/auth.service.js';
import catchAsync from '../utils/catchAsync.js';
import { clearAuthCookies, setAuthSessionCookie } from '../utils/token.utils.js';

// Fixed: added admin login endpoint that issues signed HttpOnly session cookies.
export const adminLogin = catchAsync(async (req, res) => {
  const { user, sessionToken } = await authService.adminAuthService(req.body || {});
  setAuthSessionCookie(res, sessionToken);

  res.status(200).json({
    success: true,
    token: sessionToken,
    data: {
      user: authService.serializeUser(user),
    },
  });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await authService.getAuthenticatedUser(req.user.id);
  res.status(200).json({
    success: true,
    data: {
      user: authService.serializeUser(user),
    },
  });
});

export const logout = catchAsync(async (req, res) => {
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});
