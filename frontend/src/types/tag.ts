export interface Tag {
  id: string;
  tenant_id: string;
  name: string;
  color?: string;
  use_count: number;
  created_at: string;
  updated_at?: string;
}

export interface TagStats {
  total_tags: number;
  total_uses: number;
  popular_tags: {name: string; count: number}[];
}

export interface TagSuggestResponse {
  tags: string[];
}

export interface TagMergeRequest {
  source_tag: string;
  target_tag: string;
}

export interface TagMergeResponse {
  message: string;
  merged_count: number;
}
