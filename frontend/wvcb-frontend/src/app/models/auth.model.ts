// auth.model.ts
export interface RegisterModel {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginModel {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  section?: string;
  instrument?: string;
  sessionId: string;
}

export interface ErrorResponse {
  status: string;
  message: string;
  errors?: string[];
}
