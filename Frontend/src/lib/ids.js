export const normalizeContentId = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  if (typeof value === 'object') {
    if (value?.$oid) {
      return normalizeContentId(value.$oid);
    }

    if (typeof value.toHexString === 'function') {
      return normalizeContentId(value.toHexString());
    }

    if (value?.id || value?._id || value?.contentId) {
      return normalizeContentId(value.id ?? value._id ?? value.contentId);
    }

    if (typeof value.toString === 'function') {
      const serialized = String(value.toString()).trim();

      if (serialized && serialized !== '[object Object]') {
        return serialized;
      }
    }
  }

  return '';
};
