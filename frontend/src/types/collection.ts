export type CollectionType = 'article' | 'video' | 'book' | 'tool' | 'resource' | 'record' | 'experience';

export interface Collection {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  description?: string;
  url?: string;
  content_type?: CollectionType;
  content_id?: string;
  content_data?: Record<string, any>;
  tags: string[];
  is_favorite: boolean;
  order_index: number;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CollectionCreate {
  title: string;
  description?: string;
  url?: string;
  content_type?: CollectionType;
  content_id?: string;
  content_data?: Record<string, any>;
  tags?: string[];
  is_favorite?: boolean;
  is_public?: boolean;
}

export interface CollectionUpdate {
  title?: string;
  description?: string;
  url?: string;
  content_type?: CollectionType;
  content_id?: string;
  content_data?: Record<string, any>;
  tags?: string[];
  is_favorite?: boolean;
  is_public?: boolean;
}

export interface CollectionListResponse {
  data: Collection[];
  total: number;
  page: number;
  page_size: number;
}
