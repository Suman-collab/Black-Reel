const defaultDemoVideoUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const titleVideoMap = {
  'brothas in arms': 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  kinky: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  burden: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'he lifted': defaultDemoVideoUrl,
  'blood sisters': 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'glory road': defaultDemoVideoUrl,
  'love match': 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'velvet room': 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
};

export const resolveDemoVideoUrl = ({ title = '', videoUrl = '' } = {}) => {
  const trimmedUrl = videoUrl.trim();

  if (trimmedUrl && !trimmedUrl.includes('example.com/videos/')) {
    return trimmedUrl;
  }

  return titleVideoMap[title.trim().toLowerCase()] || defaultDemoVideoUrl;
};

export const getDefaultDemoVideoUrl = () => defaultDemoVideoUrl;
