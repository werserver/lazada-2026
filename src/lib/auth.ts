// Admin credentials — hardcoded for simplicity
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "sofaraway";

const AUTH_KEY = "aff-shop-admin-auth";

export function verifyCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function getUsername(): string {
  return ADMIN_USERNAME;
}

export function isAdminLoggedIn(): boolean {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "authenticated";
  } catch {
    return false;
  }
}

export function loginAdmin(): void {
  sessionStorage.setItem(AUTH_KEY, "authenticated");
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(AUTH_KEY);
}
