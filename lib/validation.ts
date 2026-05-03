export function isValidProjectId(id: string): boolean {
  return /^c[a-z0-9]{24}$/.test(id);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}