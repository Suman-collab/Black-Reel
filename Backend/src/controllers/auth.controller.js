import * as authService from '../services/auth.service.js';
import catchAsync from '../utils/catchAsync.js';

export const register = catchAsync(async (req, res, next) => {
  const { user, token } = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    token,
    data: {
      user: authService.serializeUser(user)
    }
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { user, token } = await authService.loginUser(req.body);

  res.status(200).json({
    success: true,
    token,
    data: {
      user: authService.serializeUser(user)
    }
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  const user = await authService.getAuthenticatedUser(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user: authService.serializeUser(user)
    }
  });
});
