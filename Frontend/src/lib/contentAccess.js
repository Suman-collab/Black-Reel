export const PARENTAL_CONTROLS_DESCRIPTION =
  'Parental Controls lock premium and mature categories (Action, Thriller, Mystery, Horror, Originals).';

const PARENTAL_RESTRICTED_GENRES = new Set(['action', 'thriller', 'mystery', 'horror', 'originals']);
const PARENTAL_RESTRICTED_TAGS = new Set(['mature', 'explicit', '18+', 'violence']);

export const hasParentalControlsEnabled = (value) =>
  Boolean(value?.preferences?.parentalControls ?? value?.parentalControls);

const hasRestrictedTag = (content) => {
  const tags = Array.isArray(content?.tags) ? content.tags : [];
  return tags.some((tag) => PARENTAL_RESTRICTED_TAGS.has(String(tag).trim().toLowerCase()));
};

const isRestrictedGenre = (content) =>
  PARENTAL_RESTRICTED_GENRES.has(String(content?.genre || '').trim().toLowerCase());

export const isContentRestrictedByParentalControls = (content, value) => {
  if (!content || !hasParentalControlsEnabled(value)) {
    return false;
  }

  return Boolean(content.isPremium || isRestrictedGenre(content) || hasRestrictedTag(content));
};

export const getParentalControlsRestrictionReason = (content) => {
  if (content?.isPremium) {
    return 'Parental Controls are on, so premium titles are locked on this profile.';
  }

  if (isRestrictedGenre(content)) {
    return `Parental Controls are on, so ${content.genre || 'this'} titles are locked on this profile.`;
  }

  if (hasRestrictedTag(content)) {
    return 'Parental Controls are on, so mature-tagged titles are locked on this profile.';
  }

  return 'Parental Controls are on, so this title is locked on this profile.';
};
