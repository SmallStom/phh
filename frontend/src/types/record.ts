export type RecordStatus = 'draft' | 'published' | 'archived';
export type RecordType = 'note' | 'idea' | 'log';

export interface UserInfo {
  id: string;
  username: string;
  email: string;
}

export interface Record {
  id: string;
  tenant_id: string;
  user_id: string;
  user?: UserInfo;
  title?: string;
  content: string;
  status: RecordStatus;
  record_type: RecordType;
  parent_id?: string;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  published_at?: string;
  tags: string[];
  image_urls?: string[];
  like_count: number;
  comment_count: number;
  is_liked?: boolean;
}

export interface RecordCreate {
  title?: string;
  content: string;
  status?: RecordStatus;
  record_type?: RecordType;
  parent_id?: string;
  is_public?: boolean;
  tags?: string[];
}

export interface RecordUpdate {
  title?: string;
  content?: string;
  status?: RecordStatus;
  record_type?: RecordType;
  is_public?: boolean;
}

export interface RecordListResponse {
  data: Record[];
  total: number;
  page: number;
  page_size: number;
}
