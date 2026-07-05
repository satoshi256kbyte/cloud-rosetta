/** 比較結果プロバイダー情報 */
export interface Provider {
  name: string;
  serviceName: string;
  summary: string;
  details?: string;
  sources: string[];
}

/** 比較結果データ（S3 result.json） */
export interface ComparisonResult {
  themeId: string;
  axisId: string;
  providers: Provider[];
  comparedAt: string;
  comparedBy: string;
}

/** DynamoDB メタデータ */
export interface ComparisonMetadata {
  themeId: string;
  axisId: string;
  status: string;
  version: number;
  title?: string;
  description?: string;
  updatedAt: string;
  createdAt?: string;
  providers?: string[];
}

/** テーマカード表示用（DynamoDB 集約結果） */
export interface ThemeCardData {
  themeId: string;
  title: string;
  description: string;
  axisCount: number;
  providers: string[];
  latestUpdate: string;
}

/** フィルタ状態 */
export interface FilterState {
  providers: string[];
}

/** ページネーション状態 */
export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

/** ページネーション付きテーマ一覧レスポンス */
export interface PaginatedThemes {
  themes: ThemeCardData[];
  pagination: PaginationState;
}
