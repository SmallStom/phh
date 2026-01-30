import apiClient from './client';

export interface UploadResponse {
  success: boolean;
  data: {
    filename: string;
    url: string;
    size: number;
    content_type: string;
    category?: string;
  };
}

export interface MultipleUploadResponse {
  success: boolean;
  data: UploadResponse['data'][];
  errors?: { filename: string; error: string }[];
}

export const uploadApi = {
  // 上传图片
  uploadImage: async (file: File): Promise<{ data: UploadResponse }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 上传文件
  uploadFile: async (file: File): Promise<{ data: UploadResponse }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiClient.post('/api/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 批量上传图片
  uploadMultipleImages: async (files: File[]): Promise<{ data: MultipleUploadResponse }> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    return apiClient.post('/api/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
