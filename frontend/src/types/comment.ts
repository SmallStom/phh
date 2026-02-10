export interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface CommentCreate {
  content: string;
  parent_id?: string;
  reply_to?: string;
  reply_to_user_id?: string;
}

export interface Comment {
  id: string;
  tenant_id: string;
  record_id: string;
  user_id: string;
  user?: UserInfo;
  content: string;
  parent_id?: string;
  reply_to_user_id?: string;
  reply_to_user?: UserInfo;
  replies?: Comment[];
  reply_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CommentListResponse {
  data: Comment[];
  total: number;
  page: number;
  page_size: number;
}
