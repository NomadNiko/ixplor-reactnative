import { API_URL } from './config';
import { getTokensInfo } from './storage';

const createHeaders = async (includeAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const tokens = await getTokensInfo();
    if (tokens?.token) {
      headers.Authorization = `Bearer ${tokens.token}`;
    }
  }

  return headers;
};

export interface FileEntity {
  id: string;
  path: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  photo?: FileEntity | null;
  password?: string;
  oldPassword?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photo?: FileEntity;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse {
  data: User;
}

export const profileApi = {
  async updateProfile(updateData: UpdateProfileDto): Promise<ProfileResponse> {
    console.log('ProfileAPI - Updating user profile:', {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      email: updateData.email,
      hasPhoto: !!updateData.photo,
      hasPassword: !!updateData.password,
    });

    const response = await fetch(`${API_URL}/v1/auth/me`, {
      method: 'PATCH',
      headers: await createHeaders(true),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('ProfileAPI - Failed to update profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }

    const result = await response.json();

    console.log('ProfileAPI - Profile updated successfully:', {
      id: result.id,
      name: `${result.firstName} ${result.lastName}`,
      email: result.email,
      hasPhoto: !!result.photo,
    });

    return { data: result };
  },

  async uploadProfileImage(imageUri: string): Promise<FileEntity> {
    console.log('ProfileAPI - Uploading profile image');

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    const tokens = await getTokensInfo();
    const headers: Record<string, string> = {};

    if (tokens?.token) {
      headers.Authorization = `Bearer ${tokens.token}`;
    }

    const response = await fetch(`${API_URL}/v1/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('ProfileAPI - Failed to upload image:', error);
      throw new Error(error.message || 'Failed to upload image');
    }

    const result = await response.json();

    // The backend returns the file in a specific format based on the frontend code
    const fileEntity = result.file || result;

    console.log('ProfileAPI - Image uploaded successfully:', {
      id: fileEntity.id,
      path: fileEntity.path,
    });

    return fileEntity;
  },
};
