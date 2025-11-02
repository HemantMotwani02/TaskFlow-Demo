// A lightweight bridge to trigger toasts from non-React modules
// The ToastProvider will register the real implementations at runtime

const toastService = {
  // No-op defaults; will be set by register()
  showSuccess: (message, title) => {
    console.info('[toastService] success:', title, message);
  },
  showError: (message, title) => {
    console.error('[toastService] error:', title, message);
  },
  showWarning: (message, title) => {
    console.warn('[toastService] warning:', title, message);
  },
  showInfo: (message, title) => {
    console.log('[toastService] info:', title, message);
  },
  register(toastFns) {
    if (!toastFns) return;
    if (typeof toastFns.showSuccess === 'function') this.showSuccess = toastFns.showSuccess;
    if (typeof toastFns.showError === 'function') this.showError = toastFns.showError;
    if (typeof toastFns.showWarning === 'function') this.showWarning = toastFns.showWarning;
    if (typeof toastFns.showInfo === 'function') this.showInfo = toastFns.showInfo;
  }
};

export default toastService;


