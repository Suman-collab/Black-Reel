

const UA_OS_PATTERNS = [
  { pattern: /Windows NT 10/i,    os: 'Windows 10',   type: 'laptop'  },
  { pattern: /Windows NT 11/i,    os: 'Windows 11',   type: 'laptop'  },
  { pattern: /Windows/i,          os: 'Windows',      type: 'laptop'  },
  { pattern: /Macintosh|Mac OS X/i, os: 'macOS',      type: 'laptop'  },
  { pattern: /Android/i,          os: 'Android',      type: 'phone'   },
  { pattern: /iPhone/i,           os: 'iOS (iPhone)', type: 'phone'   },
  { pattern: /iPad/i,             os: 'iOS (iPad)',   type: 'tablet'  },
  { pattern: /CrOS/i,             os: 'ChromeOS',     type: 'laptop'  },
  { pattern: /Linux/i,            os: 'Linux',        type: 'laptop'  },
  { pattern: /Smart TV|Tizen|WebOS/i, os: 'Smart TV', type: 'tv'     },
];

const UA_BROWSER_PATTERNS = [
  { pattern: /Edg\//i,           browser: 'Edge'    },
  { pattern: /OPR\//i,           browser: 'Opera'   },
  { pattern: /Chrome/i,          browser: 'Chrome'  },
  { pattern: /Firefox/i,         browser: 'Firefox' },
  { pattern: /Safari/i,          browser: 'Safari'  },
];


export const detectDevice = (ua = '') => {
  const uaStr = String(ua || '');

  let os      = 'Unknown OS';
  let type    = 'browser';
  let browser = 'Unknown Browser';

  for (const { pattern, os: detectedOs, type: detectedType } of UA_OS_PATTERNS) {
    if (pattern.test(uaStr)) {
      os   = detectedOs;
      type = detectedType;
      break;
    }
  }

  for (const { pattern, browser: detectedBrowser } of UA_BROWSER_PATTERNS) {
    if (pattern.test(uaStr)) {
      browser = detectedBrowser;
      break;
    }
  }

  const name = `${browser} on ${os}`;

  return { os, type, browser, name };
};


export const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || 'Unknown';
};
