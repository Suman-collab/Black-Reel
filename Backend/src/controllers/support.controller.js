import Support from '../models/support.model.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const submitContact = catchAsync(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    throw new AppError('Name, email, subject, and message are required fields', 400);
  }

  const supportRequest = await Support.create({
    name,
    email,
    subject,
    message
  });

  res.status(201).json({
    success: true,
    message: 'Support request submitted successfully. We respond within 24 hours.',
    data: {
      supportRequest
    }
  });
});
