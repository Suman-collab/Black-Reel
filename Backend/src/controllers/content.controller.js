import * as contentService from '../services/content.service.js';
import catchAsync from '../utils/catchAsync.js';

export const getAllContent = catchAsync(async (req, res, next) => {
  const content = await contentService.getContentList(req.query);
  res.status(200).json({
    success: true,
    count: content.length,
    data: { content: content.map(contentService.mapContent) }
  });
});

export const getContent = catchAsync(async (req, res, next) => {
  const content = await contentService.getContentDetails(req.params.id);
  res.status(200).json({ success: true, data: { content: contentService.mapContent(content) } });
});

export const createContent = catchAsync(async (req, res, next) => {
  const content = await contentService.createContent(req.body, req.user.id);
  res.status(201).json({ success: true, data: { content: contentService.mapContent(content) } });
});

export const updateContent = catchAsync(async (req, res, next) => {
  const content = await contentService.updateContent(req.params.id, req.body);
  res.status(200).json({ success: true, data: { content: contentService.mapContent(content) } });
});

export const deleteContent = catchAsync(async (req, res, next) => {
  await contentService.deleteContent(req.params.id);
  res.status(204).json({ success: true, data: null });
});
