export type ExperienceCategory = 'work' | 'project' | 'education' | 'milestone';

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface Experience {
  id: string;
  tenant_id: string;
  user_id: string;
  user?: UserInfo;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  category?: ExperienceCategory;
  tags: string[];
  source_record_id?: string;
  order_index: number;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  record_count?: number;
}

export interface ExperienceCreate {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
  category?: ExperienceCategory;
  tags?: string[];
  source_record_id?: string;
  is_public?: boolean;
}

export interface ExperienceUpdate {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  category?: ExperienceCategory;
  tags?: string[];
  is_public?: boolean;
}

export interface ExperienceListResponse {
  data: Experience[];
  total: number;
  page: number;
  page_size: number;
}
