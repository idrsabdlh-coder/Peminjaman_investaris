import { DB } from './db';
import { User } from '../types';

const SESSION_KEY = 'kantor_admin_session';

export interface SessionState {
  user: User | null;
}

class AuthService {
  private user: User | null = null;
  private listeners: ((state: SessionState) => void)[] = [];

  constructor() {
    this.restoreSession();
  }

  // Pulihkan login terakhir (tanpa batas waktu)
  private restoreSession() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user) {
          this.user = parsed.user;
        }
      }
    } catch {
      // abaikan data rusak
    }
  }

  public subscribe(callback: (state: SessionState) => void) {
    this.listeners.push(callback);
    callback(this.getState());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((cb) => cb(state));
  }

  public getState(): SessionState {
    return { user: this.user };
  }

  public isAuthenticated(): boolean {
    return !!this.user;
  }

  public getCurrentUser(): User | null {
    return this.user;
  }

  public login(username: string, password: string): { success: boolean; message?: string } {
    const user = DB.findUserByUsername(username);
    if (!user || user.passwordHash !== password) {
      return { success: false, message: 'Username atau password salah!' };
    }

    this.user = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user }));
    this.notify();
    return { success: true };
  }

  public logout(reason?: string) {
    this.user = null;
    localStorage.removeItem(SESSION_KEY);
    this.notify();
    if (reason) {
      console.log('Admin logged out:', reason);
    }
  }
}

export const Auth = new AuthService();