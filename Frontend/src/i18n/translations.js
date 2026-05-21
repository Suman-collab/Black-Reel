export const LANGUAGE_OPTIONS = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Spanish' },
];

export const DEFAULT_LANGUAGE_CODE = 'en-US';

export const codeToLabel = (code = '') => {
  const normalizedCode = String(code).trim();
  return LANGUAGE_OPTIONS.find((item) => item.code === normalizedCode)?.label || 'English (US)';
};

export const labelToCode = (label = '') => {
  const normalizedLabel = String(label).trim();
  return LANGUAGE_OPTIONS.find((item) => item.label === normalizedLabel)?.code || DEFAULT_LANGUAGE_CODE;
};

export const translations = {
  'en-US': {
    nav: {
      home: 'Home',
      categories: 'Categories',
      fandom: 'Fandom',
      watchlist: 'Watchlist',
      subscribe: 'Subscribe',
      signIn: 'Sign In',
      logout: 'Logout',
      manageUpgrade: 'Manage / Upgrade',
      completeUpgrade: 'Complete / Upgrade',
      currentPlan: 'Current Plan',
      accountRestricted: 'Account Restricted',
      searchPlaceholder: 'Titles, people, genres',
    },
    settings: {
      title: 'Settings',
      name: 'Name',
      email: 'Email',
      avatar: 'Avatar',
      uploadNewImage: 'Upload New Image',
      resetDefault: 'Reset Default',
      notifications: 'Notifications',
      notificationsDesc: 'New episodes, promos & updates',
      parentalControls: 'Parental Controls',
      language: 'Language',
      subscription: 'Subscription',
      noActivePlan: 'No active plan',
      manageUpgrade: 'Manage / Upgrade',
      viewPlans: 'View Plans',
      saveSettings: 'Save Settings',
      saving: 'Saving...',
      logOut: 'Log Out',
      saveSuccess: 'Settings saved successfully.',
      avatarHint: 'Use an image URL or upload JPG, PNG, or WebP up to 350 KB.',
    },
  },
  'en-GB': {
    nav: {
      home: 'Home',
      categories: 'Categories',
      fandom: 'Fandom',
      watchlist: 'Watchlist',
      subscribe: 'Subscribe',
      signIn: 'Sign In',
      logout: 'Log Out',
      manageUpgrade: 'Manage / Upgrade',
      completeUpgrade: 'Complete / Upgrade',
      currentPlan: 'Current Plan',
      accountRestricted: 'Account Restricted',
      searchPlaceholder: 'Titles, people, genres',
    },
    settings: {
      title: 'Settings',
      name: 'Name',
      email: 'Email',
      avatar: 'Avatar',
      uploadNewImage: 'Upload New Image',
      resetDefault: 'Reset Default',
      notifications: 'Notifications',
      notificationsDesc: 'New episodes, promos & updates',
      parentalControls: 'Parental Controls',
      language: 'Language',
      subscription: 'Subscription',
      noActivePlan: 'No active plan',
      manageUpgrade: 'Manage / Upgrade',
      viewPlans: 'View Plans',
      saveSettings: 'Save Settings',
      saving: 'Saving...',
      logOut: 'Log Out',
      saveSuccess: 'Settings saved successfully.',
      avatarHint: 'Use an image URL or upload JPG, PNG, or WebP up to 350 KB.',
    },
  },
  'es-ES': {
    nav: {
      home: 'Inicio',
      categories: 'Categorias',
      fandom: 'Fandom',
      watchlist: 'Mi lista',
      subscribe: 'Suscribirse',
      signIn: 'Iniciar sesion',
      logout: 'Cerrar sesion',
      manageUpgrade: 'Gestionar / Mejorar',
      completeUpgrade: 'Completar / Mejorar',
      currentPlan: 'Plan actual',
      accountRestricted: 'Cuenta restringida',
      searchPlaceholder: 'Titulos, personas, generos',
    },
    settings: {
      title: 'Configuracion',
      name: 'Nombre',
      email: 'Correo',
      avatar: 'Avatar',
      uploadNewImage: 'Subir imagen',
      resetDefault: 'Restablecer',
      notifications: 'Notificaciones',
      notificationsDesc: 'Nuevos episodios, promociones y actualizaciones',
      parentalControls: 'Control parental',
      language: 'Idioma',
      subscription: 'Suscripcion',
      noActivePlan: 'Sin plan activo',
      manageUpgrade: 'Gestionar / Mejorar',
      viewPlans: 'Ver planes',
      saveSettings: 'Guardar ajustes',
      saving: 'Guardando...',
      logOut: 'Cerrar sesion',
      saveSuccess: 'Configuracion guardada correctamente.',
      avatarHint: 'Usa una URL o sube JPG, PNG o WebP de hasta 350 KB.',
    },
  },
};
