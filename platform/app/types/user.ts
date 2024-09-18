export interface UserData {
  id: number;
  email: string;
  email_verified: boolean;
  date_joined: string;
  is_active: boolean;
  onboarding_completed: boolean;
}

export interface User {
  status: string;
  message: string;
  data: UserData;
}

export interface UploadSamplesProps {
  user: User;
}