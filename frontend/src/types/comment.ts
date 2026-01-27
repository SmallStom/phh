export interface UserInfo {
  id: string;
  username: string;
  email: string;
}

export interface CommentCreate {
  content: string;
}

export interface Comment {
  id: string;
  tenant_id: string;
  record_id: string;
  user_id: string;
  user?: UserInfo;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface CommentListResponse {
  data: Comment[];
  total: number;
  page: number;
  page_size: number;
}
