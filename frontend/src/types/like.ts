export interface LikeResponse {
  id: string;
  tenant_id: string;
  record_id: string;
  user_id: string;
  created_at: string;
}

export interface LikeStatusResponse {
  is_liked: boolean;
  like_count: number;
}
