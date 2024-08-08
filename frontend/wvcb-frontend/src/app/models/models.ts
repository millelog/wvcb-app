// models.ts

export interface ApplicationUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  instrument?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  joinDate: Date;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
  sectionId?: string;
  identityUserId?: string;
}

export interface Section {
  id: string;
  name: string;
  description: string;
  leaderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  type: EventType;
  name: string;
  description: string;
  date: Date;
  startTime: string; // Use string for TimeSpan
  endTime: string; // Use string for TimeSpan
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id: string;
  userId: string;
  eventId: string;
  status: AttendanceStatus;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MusicPiece {
  id: string;
  title: string;
  composer: string;
  arranger: string;
  genre: string;
  difficulty?: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventMusicPiece {
  id: string;
  eventId: string;
  musicPieceId: string;
  order?: number;
}

export interface MailingListSubscriber {
  id: string;
  email: string;
  name: string;
  subscribedAt: Date;
  isActive: boolean;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  userAgent?: string;
  ipAddress?: string;
  lastActive?: string;
  data?: string;
  token: string;
  user: ApplicationUser;
}

export enum UserRole {
  Admin = 'Admin',
  Board = 'Board',
  Leader = 'Leader',
  Member = 'Member',
  Guest = 'Guest',
}

export enum UserStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  OnLeave = 'OnLeave',
}

export enum EventType {
  Rehearsal = 'Rehearsal',
  Concert = 'Concert',
  Meeting = 'Meeting',
}

export enum AttendanceStatus {
  Attending = 'Attending',
  NotAttending = 'NotAttending',
  Tentative = 'Tentative',
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  errors?: string[];
  data?: T;
}

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

export interface ErrorResponse {
  status: string;
  message: string;
  errors?: string[];
}
