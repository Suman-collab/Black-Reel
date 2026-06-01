import * as contentService from '../services/content.service.js';
import * as videoService from '../services/video.service.js';
import catchAsync from '../utils/catchAsync.js';

export const getAllContent = catchAsync(async (req, res, next) => {
  const content = await contentService.getContentList(req.query, req.user || null);
  res.status(200).json({
    success: true,
    count: content.length,
    data: { content: content.map(contentService.mapContent) }
  });
});

export const getContent = catchAsync(async (req, res, next) => {
  const content = await contentService.getContentDetails(req.params.id, req.user || null);
  res.status(200).json({ success: true, data: { content: contentService.mapContent(content) } });
});

export const createContent = catchAsync(async (req, res, next) => {
  const content = await contentService.createContent(req.body, req.user.id, req.files || {});
  res.status(201).json({ success: true, data: { content: contentService.mapContent(content) } });
});

export const updateContent = catchAsync(async (req, res, next) => {
  const content = await contentService.updateContent(req.params.id, req.body, req.files || {});
  res.status(200).json({ success: true, data: { content: contentService.mapContent(content) } });
});

export const deleteContent = catchAsync(async (req, res, next) => {
  await contentService.deleteContent(req.params.id);
  res.status(204).json({ success: true, data: null });
});

export const watchContent = catchAsync(async (req, res, next) => {
  const result = await contentService.registerWatchEvent(req.params.id, req.user);
  res.status(200).json({ success: true, data: result });
});

export const getEpisodes = catchAsync(async (req, res, next) => {
  const episodes = await contentService.getEpisodesBySeries(req.params.id);
  res.status(200).json({
    success: true,
    count: episodes.length,
    data: { episodes: episodes.map(contentService.mapContent) },
  });
});

export const streamVideo = catchAsync(async (req, res, next) => {
  const streamData = await videoService.getStreamUrl(req.params.id, req.user);
  res.status(200).json({
    success: true,
    data: streamData,
  });
});
