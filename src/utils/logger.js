export function logAction(category, action, details = null) {
  const timestamp = new Date().toISOString();
  if (details !== null && details !== undefined) {
    console.log(`[ACTION][${timestamp}][${category}] ${action}`, JSON.stringify(details));
  } else {
    console.log(`[ACTION][${timestamp}][${category}] ${action}`);
  }
}

export function logError(category, action, error) {
  const timestamp = new Date().toISOString();
  console.error(`[ERROR][${timestamp}][${category}] ${action}`, error?.message || error);
}
