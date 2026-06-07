/**
 * Database types.
 *
 * Hand-authored to match supabase/migrations. In a configured project these are
 * regenerated with: `supabase gen types typescript --linked > src/types/database.ts`
 *
 * NOTE: Row/Insert/Update use `type` (object literals), not `interface`.
 * Interfaces are not assignable to `Record<string, unknown>`, which would make
 * the schema fail supabase-js's `GenericSchema` constraint and resolve queries
 * to `never`. Generated Supabase types use `type` for the same reason.
 */

export type UserRole = "public" | "member" | "moderator" | "admin";
export type MembershipStatus = "pending" | "active" | "suspended" | "alumni";
export type ContentStatus = "draft" | "published" | "archived";
export type RegistrationStatus = "registered" | "cancelled" | "waitlisted";
export type AttendanceStatus = "present" | "absent";
export type AchievementVisibility = "public" | "members" | "private";
export type RecognitionSource = "manual" | "automatic";
export type AwardStatus = "recommended" | "awarded" | "rejected";
export type BadgeMetric =
  | "events_attended"
  | "events_registered"
  | "activities_joined"
  | "suggestions_submitted"
  | "suggestions_implemented"
  | "suggestions_supported";
export type SuggestionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "accepted"
  | "planned"
  | "in_progress"
  | "implemented"
  | "rejected"
  | "archived";
export type SuggestionVisibility = "private" | "members" | "public";
export type SuggestionPriority = "low" | "medium" | "high" | "critical";
export type MediaStatus = "active" | "archived" | "deleted";
export type MediaVisibility = "public" | "private";

/* ------------------------------- users ----------------------------------- */
export type UsersRow = {
  id: string;
  role: UserRole;
  full_name: string;
  full_name_ne: string | null;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};
export type UsersInsert = {
  id: string;
  role?: UserRole;
  full_name: string;
  full_name_ne?: string | null;
  email: string;
  avatar_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string | null;
};
export type UsersUpdate = Partial<UsersInsert>;

/* -------------------------- member_profiles ------------------------------- */
export type MemberProfilesRow = {
  user_id: string;
  student_code: string | null;
  class_level: string | null;
  section: string | null;
  bio: string | null;
  bio_ne: string | null;
  interests: string[] | null;
  membership_status: MembershipStatus;
  joined_on: string;
  created_at: string;
  updated_at: string | null;
};
export type MemberProfilesInsert = {
  user_id: string;
  student_code?: string | null;
  class_level?: string | null;
  section?: string | null;
  bio?: string | null;
  bio_ne?: string | null;
  interests?: string[] | null;
  membership_status?: MembershipStatus;
  joined_on?: string;
  created_at?: string;
  updated_at?: string | null;
};
export type MemberProfilesUpdate = Partial<MemberProfilesInsert>;

/* ----------------------------- audit_logs --------------------------------- */
export type AuditLogsRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
export type AuditLogsInsert = {
  id?: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
};
export type AuditLogsUpdate = Partial<AuditLogsInsert>;

/* ------------------------- activity_categories ---------------------------- */
export type ActivityCategoryRow = {
  id: string;
  slug: string;
  name: string;
  name_ne: string | null;
  sort_order: number;
  created_at: string;
};
export type ActivityCategoryInsert = {
  id?: string;
  slug: string;
  name: string;
  name_ne?: string | null;
  sort_order?: number;
  created_at?: string;
};
export type ActivityCategoryUpdate = Partial<ActivityCategoryInsert>;

/* ------------------------------ activities -------------------------------- */
export type ActivityRow = {
  id: string;
  slug: string;
  title: string;
  title_ne: string | null;
  description: string | null;
  description_ne: string | null;
  category_id: string | null;
  cover_url: string | null;
  status: ContentStatus;
  starts_on: string | null;
  ends_on: string | null;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
};
export type ActivityInsert = {
  id?: string;
  slug: string;
  title: string;
  title_ne?: string | null;
  description?: string | null;
  description_ne?: string | null;
  category_id?: string | null;
  cover_url?: string | null;
  status?: ContentStatus;
  starts_on?: string | null;
  ends_on?: string | null;
  created_by?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
};
export type ActivityUpdate = Partial<ActivityInsert>;

/* ------------------------- activity_participants -------------------------- */
export type ActivityParticipantRow = {
  id: string;
  activity_id: string;
  member_id: string;
  role: string;
  joined_at: string;
};
export type ActivityParticipantInsert = {
  id?: string;
  activity_id: string;
  member_id: string;
  role?: string;
  joined_at?: string;
};
export type ActivityParticipantUpdate = Partial<ActivityParticipantInsert>;

/* -------------------------------- events ---------------------------------- */
export type EventRow = {
  id: string;
  slug: string;
  title: string;
  title_ne: string | null;
  description: string | null;
  description_ne: string | null;
  venue: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  registration_deadline: string | null;
  status: ContentStatus;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
};
export type EventInsert = {
  id?: string;
  slug: string;
  title: string;
  title_ne?: string | null;
  description?: string | null;
  description_ne?: string | null;
  venue?: string | null;
  starts_at: string;
  ends_at?: string | null;
  capacity?: number | null;
  registration_deadline?: string | null;
  status?: ContentStatus;
  created_by?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
};
export type EventUpdate = Partial<EventInsert>;

/* --------------------------- event_registrations -------------------------- */
export type EventRegistrationRow = {
  id: string;
  event_id: string;
  member_id: string;
  status: RegistrationStatus;
  registered_at: string;
  cancelled_at: string | null;
};
export type EventRegistrationInsert = {
  id?: string;
  event_id: string;
  member_id: string;
  status?: RegistrationStatus;
  registered_at?: string;
  cancelled_at?: string | null;
};
export type EventRegistrationUpdate = Partial<EventRegistrationInsert>;

/* --------------------------- attendance_records --------------------------- */
export type AttendanceRecordRow = {
  id: string;
  event_id: string;
  member_id: string;
  status: AttendanceStatus;
  marked_by: string | null;
  marked_at: string;
};
export type AttendanceRecordInsert = {
  id?: string;
  event_id: string;
  member_id: string;
  status: AttendanceStatus;
  marked_by?: string | null;
  marked_at?: string;
};
export type AttendanceRecordUpdate = Partial<AttendanceRecordInsert>;

/* ------------------------- achievement_categories ------------------------- */
export type AchievementCategoryRow = {
  id: string;
  slug: string;
  name: string;
  name_ne: string | null;
  description: string | null;
  sort_order: number;
  created_at: string;
};
export type AchievementCategoryInsert = {
  id?: string;
  slug: string;
  name: string;
  name_ne?: string | null;
  description?: string | null;
  sort_order?: number;
  created_at?: string;
};
export type AchievementCategoryUpdate = Partial<AchievementCategoryInsert>;

/* -------------------------------- badges ---------------------------------- */
export type BadgeRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  category_id: string | null;
  criteria: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};
export type BadgeInsert = {
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  category_id?: string | null;
  criteria?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string | null;
};
export type BadgeUpdate = Partial<BadgeInsert>;

/* ------------------------------ badge_rules ------------------------------- */
export type BadgeRuleRow = {
  id: string;
  badge_id: string;
  metric: BadgeMetric;
  comparator: string;
  threshold: number;
  is_active: boolean;
  created_at: string;
};
export type BadgeRuleInsert = {
  id?: string;
  badge_id: string;
  metric: BadgeMetric;
  comparator?: string;
  threshold: number;
  is_active?: boolean;
  created_at?: string;
};
export type BadgeRuleUpdate = Partial<BadgeRuleInsert>;

/* -------------------------- member_achievements --------------------------- */
export type MemberAchievementRow = {
  id: string;
  member_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  award_date: string;
  awarded_by: string | null;
  evidence: string | null;
  visibility: AchievementVisibility;
  source: RecognitionSource;
  status: AwardStatus;
  created_at: string;
  updated_at: string | null;
};
export type MemberAchievementInsert = {
  id?: string;
  member_id: string;
  title: string;
  description?: string | null;
  category_id?: string | null;
  award_date?: string;
  awarded_by?: string | null;
  evidence?: string | null;
  visibility?: AchievementVisibility;
  source?: RecognitionSource;
  status?: AwardStatus;
  created_at?: string;
  updated_at?: string | null;
};
export type MemberAchievementUpdate = Partial<MemberAchievementInsert>;

/* ----------------------------- member_badges ------------------------------ */
export type MemberBadgeRow = {
  id: string;
  member_id: string;
  badge_id: string;
  awarded_by: string | null;
  source: RecognitionSource;
  status: AwardStatus;
  awarded_at: string;
};
export type MemberBadgeInsert = {
  id?: string;
  member_id: string;
  badge_id: string;
  awarded_by?: string | null;
  source?: RecognitionSource;
  status?: AwardStatus;
  awarded_at?: string;
};
export type MemberBadgeUpdate = Partial<MemberBadgeInsert>;

/* ----------------------------- certificates ------------------------------- */
export type CertificateRow = {
  id: string;
  certificate_number: string;
  title: string;
  recipient_id: string;
  achievement_id: string | null;
  issued_date: string;
  verification_code: string;
  pdf_url: string | null;
  issued_by: string | null;
  created_at: string;
};
export type CertificateInsert = {
  id?: string;
  certificate_number: string;
  title: string;
  recipient_id: string;
  achievement_id?: string | null;
  issued_date?: string;
  verification_code: string;
  pdf_url?: string | null;
  issued_by?: string | null;
  created_at?: string;
};
export type CertificateUpdate = Partial<CertificateInsert>;

/* -------------------------- recognition_programs -------------------------- */
export type RecognitionProgramRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  criteria: string | null;
  starts_on: string | null;
  ends_on: string | null;
  status: ContentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
};
export type RecognitionProgramInsert = {
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  criteria?: string | null;
  starts_on?: string | null;
  ends_on?: string | null;
  status?: ContentStatus;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string | null;
};
export type RecognitionProgramUpdate = Partial<RecognitionProgramInsert>;

/* --------------------------- recognition_awards --------------------------- */
export type RecognitionAwardRow = {
  id: string;
  program_id: string;
  member_id: string;
  title: string;
  period_label: string | null;
  note: string | null;
  awarded_by: string | null;
  awarded_at: string;
};
export type RecognitionAwardInsert = {
  id?: string;
  program_id: string;
  member_id: string;
  title: string;
  period_label?: string | null;
  note?: string | null;
  awarded_by?: string | null;
  awarded_at?: string;
};
export type RecognitionAwardUpdate = Partial<RecognitionAwardInsert>;

/* ------------------------- suggestion_categories -------------------------- */
export type SuggestionCategoryRow = {
  id: string;
  slug: string;
  name: string;
  name_ne: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};
export type SuggestionCategoryInsert = {
  id?: string;
  slug: string;
  name: string;
  name_ne?: string | null;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
};
export type SuggestionCategoryUpdate = Partial<SuggestionCategoryInsert>;

/* --------------------------------- tags ----------------------------------- */
export type TagRow = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
};
export type TagInsert = {
  id?: string;
  slug: string;
  name: string;
  created_at?: string;
};
export type TagUpdate = Partial<TagInsert>;

/* ------------------------------ suggestions ------------------------------- */
export type SuggestionRow = {
  id: string;
  title: string;
  description: string;
  category_id: string | null;
  status: SuggestionStatus;
  visibility: SuggestionVisibility;
  author_id: string;
  is_anonymous: boolean;
  priority: SuggestionPriority;
  moderator_notes: string | null;
  estimated_completion: string | null;
  assigned_to: string | null;
  merged_into: string | null;
  support_count: number;
  created_at: string;
  updated_at: string | null;
};
export type SuggestionInsert = {
  id?: string;
  title: string;
  description: string;
  category_id?: string | null;
  status?: SuggestionStatus;
  visibility?: SuggestionVisibility;
  author_id: string;
  is_anonymous?: boolean;
  priority?: SuggestionPriority;
  moderator_notes?: string | null;
  estimated_completion?: string | null;
  assigned_to?: string | null;
  merged_into?: string | null;
  support_count?: number;
  created_at?: string;
  updated_at?: string | null;
};
export type SuggestionUpdate = Partial<SuggestionInsert>;

/* ----------------------- suggestion_status_history ------------------------ */
export type SuggestionStatusHistoryRow = {
  id: string;
  suggestion_id: string;
  old_status: SuggestionStatus | null;
  new_status: SuggestionStatus;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
};
export type SuggestionStatusHistoryInsert = {
  id?: string;
  suggestion_id: string;
  old_status?: SuggestionStatus | null;
  new_status: SuggestionStatus;
  changed_by?: string | null;
  reason?: string | null;
  created_at?: string;
};
export type SuggestionStatusHistoryUpdate =
  Partial<SuggestionStatusHistoryInsert>;

/* --------------------------- suggestion_votes ----------------------------- */
export type SuggestionVoteRow = {
  id: string;
  suggestion_id: string;
  member_id: string;
  created_at: string;
};
export type SuggestionVoteInsert = {
  id?: string;
  suggestion_id: string;
  member_id: string;
  created_at?: string;
};
export type SuggestionVoteUpdate = Partial<SuggestionVoteInsert>;

/* --------------------------- moderator_feedback --------------------------- */
export type ModeratorFeedbackRow = {
  id: string;
  suggestion_id: string;
  moderator_id: string | null;
  body: string;
  created_at: string;
};
export type ModeratorFeedbackInsert = {
  id?: string;
  suggestion_id: string;
  moderator_id?: string | null;
  body: string;
  created_at?: string;
};
export type ModeratorFeedbackUpdate = Partial<ModeratorFeedbackInsert>;

/* ---------------------------- suggestion_tags ----------------------------- */
export type SuggestionTagRow = {
  suggestion_id: string;
  tag_id: string;
};
export type SuggestionTagInsert = {
  suggestion_id: string;
  tag_id: string;
};
export type SuggestionTagUpdate = Partial<SuggestionTagInsert>;

/* ------------------------------ app_settings ------------------------------ */
export type AppSettingRow = {
  key: string;
  value: Record<string, unknown>;
  is_public: boolean;
  updated_by: string | null;
  updated_at: string;
};
export type AppSettingInsert = {
  key: string;
  value?: Record<string, unknown>;
  is_public?: boolean;
  updated_by?: string | null;
  updated_at?: string;
};
export type AppSettingUpdate = Partial<AppSettingInsert>;

/* ------------------------------ media_folders ----------------------------- */
export type MediaFolderRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  path: string;
  color: string | null;
  icon: string | null;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
};
export type MediaFolderInsert = {
  id?: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  path?: string;
  color?: string | null;
  icon?: string | null;
  is_archived?: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string | null;
};
export type MediaFolderUpdate = Partial<MediaFolderInsert>;

/* ------------------------------- media_files ------------------------------ */
export type MediaFileRow = {
  id: string;
  filename: string;
  original_filename: string | null;
  slug: string | null;
  extension: string | null;
  mime_type: string;
  width: number | null;
  height: number | null;
  size: number;
  folder_id: string | null;
  bucket: string;
  object_path: string;
  public_url: string | null;
  thumbnail_url: string | null;
  blur_hash: string | null;
  alt_text: string | null;
  caption: string | null;
  description: string | null;
  uploaded_by: string | null;
  status: MediaStatus;
  visibility: MediaVisibility;
  checksum: string | null;
  dominant_color: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
};
export type MediaFileInsert = {
  id?: string;
  filename: string;
  original_filename?: string | null;
  slug?: string | null;
  extension?: string | null;
  mime_type: string;
  width?: number | null;
  height?: number | null;
  size?: number;
  folder_id?: string | null;
  bucket: string;
  object_path: string;
  public_url?: string | null;
  thumbnail_url?: string | null;
  blur_hash?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  description?: string | null;
  uploaded_by?: string | null;
  status?: MediaStatus;
  visibility?: MediaVisibility;
  checksum?: string | null;
  dominant_color?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string | null;
};
export type MediaFileUpdate = Partial<MediaFileInsert>;

/* --------------------------- media tags / usage --------------------------- */
export type MediaTagRow = { id: string; slug: string; name: string; created_at: string };
export type MediaTagInsert = { id?: string; slug: string; name: string; created_at?: string };
export type MediaTagUpdate = Partial<MediaTagInsert>;

export type MediaFileTagRow = { file_id: string; tag_id: string };
export type MediaFileTagInsert = { file_id: string; tag_id: string };
export type MediaFileTagUpdate = Partial<MediaFileTagInsert>;

export type MediaUsageRow = {
  id: string;
  file_id: string;
  module: string;
  entity_type: string;
  entity_id: string | null;
  field: string | null;
  label: string | null;
  created_at: string;
};
export type MediaUsageInsert = {
  id?: string;
  file_id: string;
  module: string;
  entity_type: string;
  entity_id?: string | null;
  field?: string | null;
  label?: string | null;
  created_at?: string;
};
export type MediaUsageUpdate = Partial<MediaUsageInsert>;

export type MediaVersionRow = {
  id: string;
  file_id: string;
  version: number;
  object_path: string;
  size: number | null;
  width: number | null;
  height: number | null;
  checksum: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};
export type MediaVersionInsert = {
  id?: string;
  file_id: string;
  version: number;
  object_path: string;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  checksum?: string | null;
  note?: string | null;
  created_by?: string | null;
  created_at?: string;
};
export type MediaVersionUpdate = Partial<MediaVersionInsert>;

export type MediaFavoriteRow = { file_id: string; user_id: string; created_at: string };
export type MediaFavoriteInsert = { file_id: string; user_id: string; created_at?: string };
export type MediaFavoriteUpdate = Partial<MediaFavoriteInsert>;

export type MediaCollectionRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
};
export type MediaCollectionInsert = {
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string | null;
};
export type MediaCollectionUpdate = Partial<MediaCollectionInsert>;

export type MediaCollectionItemRow = {
  collection_id: string;
  file_id: string;
  sort_order: number;
};
export type MediaCollectionItemInsert = {
  collection_id: string;
  file_id: string;
  sort_order?: number;
};
export type MediaCollectionItemUpdate = Partial<MediaCollectionItemInsert>;

/* ------------------------------ gallery CMS ------------------------------- */
export type GalleryAlbumRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  cover_file_id: string | null;
  status: ContentStatus;
  featured: boolean;
  sort_order: number;
  seo_description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  published_at: string | null;
};
export type GalleryAlbumInsert = {
  id?: string;
  slug: string;
  title: string;
  description?: string | null;
  category?: string | null;
  cover_file_id?: string | null;
  status?: ContentStatus;
  featured?: boolean;
  sort_order?: number;
  seo_description?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string | null;
  published_at?: string | null;
};
export type GalleryAlbumUpdate = Partial<GalleryAlbumInsert>;

export type GalleryPhotoRow = {
  id: string;
  album_id: string;
  file_id: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
};
export type GalleryPhotoInsert = {
  id?: string;
  album_id: string;
  file_id: string;
  caption?: string | null;
  sort_order?: number;
  created_at?: string;
};
export type GalleryPhotoUpdate = Partial<GalleryPhotoInsert>;

/* ------------------------------- schema ----------------------------------- */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: UsersRow;
        Insert: UsersInsert;
        Update: UsersUpdate;
        Relationships: [];
      };
      member_profiles: {
        Row: MemberProfilesRow;
        Insert: MemberProfilesInsert;
        Update: MemberProfilesUpdate;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogsRow;
        Insert: AuditLogsInsert;
        Update: AuditLogsUpdate;
        Relationships: [];
      };
      activity_categories: {
        Row: ActivityCategoryRow;
        Insert: ActivityCategoryInsert;
        Update: ActivityCategoryUpdate;
        Relationships: [];
      };
      activities: {
        Row: ActivityRow;
        Insert: ActivityInsert;
        Update: ActivityUpdate;
        Relationships: [];
      };
      activity_participants: {
        Row: ActivityParticipantRow;
        Insert: ActivityParticipantInsert;
        Update: ActivityParticipantUpdate;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: EventInsert;
        Update: EventUpdate;
        Relationships: [];
      };
      event_registrations: {
        Row: EventRegistrationRow;
        Insert: EventRegistrationInsert;
        Update: EventRegistrationUpdate;
        Relationships: [];
      };
      attendance_records: {
        Row: AttendanceRecordRow;
        Insert: AttendanceRecordInsert;
        Update: AttendanceRecordUpdate;
        Relationships: [];
      };
      achievement_categories: {
        Row: AchievementCategoryRow;
        Insert: AchievementCategoryInsert;
        Update: AchievementCategoryUpdate;
        Relationships: [];
      };
      badges: {
        Row: BadgeRow;
        Insert: BadgeInsert;
        Update: BadgeUpdate;
        Relationships: [];
      };
      badge_rules: {
        Row: BadgeRuleRow;
        Insert: BadgeRuleInsert;
        Update: BadgeRuleUpdate;
        Relationships: [];
      };
      member_achievements: {
        Row: MemberAchievementRow;
        Insert: MemberAchievementInsert;
        Update: MemberAchievementUpdate;
        Relationships: [];
      };
      member_badges: {
        Row: MemberBadgeRow;
        Insert: MemberBadgeInsert;
        Update: MemberBadgeUpdate;
        Relationships: [];
      };
      certificates: {
        Row: CertificateRow;
        Insert: CertificateInsert;
        Update: CertificateUpdate;
        Relationships: [];
      };
      recognition_programs: {
        Row: RecognitionProgramRow;
        Insert: RecognitionProgramInsert;
        Update: RecognitionProgramUpdate;
        Relationships: [];
      };
      recognition_awards: {
        Row: RecognitionAwardRow;
        Insert: RecognitionAwardInsert;
        Update: RecognitionAwardUpdate;
        Relationships: [];
      };
      suggestion_categories: {
        Row: SuggestionCategoryRow;
        Insert: SuggestionCategoryInsert;
        Update: SuggestionCategoryUpdate;
        Relationships: [];
      };
      tags: {
        Row: TagRow;
        Insert: TagInsert;
        Update: TagUpdate;
        Relationships: [];
      };
      suggestions: {
        Row: SuggestionRow;
        Insert: SuggestionInsert;
        Update: SuggestionUpdate;
        Relationships: [];
      };
      suggestion_status_history: {
        Row: SuggestionStatusHistoryRow;
        Insert: SuggestionStatusHistoryInsert;
        Update: SuggestionStatusHistoryUpdate;
        Relationships: [];
      };
      suggestion_votes: {
        Row: SuggestionVoteRow;
        Insert: SuggestionVoteInsert;
        Update: SuggestionVoteUpdate;
        Relationships: [];
      };
      moderator_feedback: {
        Row: ModeratorFeedbackRow;
        Insert: ModeratorFeedbackInsert;
        Update: ModeratorFeedbackUpdate;
        Relationships: [];
      };
      suggestion_tags: {
        Row: SuggestionTagRow;
        Insert: SuggestionTagInsert;
        Update: SuggestionTagUpdate;
        Relationships: [];
      };
      app_settings: {
        Row: AppSettingRow;
        Insert: AppSettingInsert;
        Update: AppSettingUpdate;
        Relationships: [];
      };
      media_folders: {
        Row: MediaFolderRow;
        Insert: MediaFolderInsert;
        Update: MediaFolderUpdate;
        Relationships: [];
      };
      media_files: {
        Row: MediaFileRow;
        Insert: MediaFileInsert;
        Update: MediaFileUpdate;
        Relationships: [];
      };
      media_tags: {
        Row: MediaTagRow;
        Insert: MediaTagInsert;
        Update: MediaTagUpdate;
        Relationships: [];
      };
      media_file_tags: {
        Row: MediaFileTagRow;
        Insert: MediaFileTagInsert;
        Update: MediaFileTagUpdate;
        Relationships: [];
      };
      media_usage: {
        Row: MediaUsageRow;
        Insert: MediaUsageInsert;
        Update: MediaUsageUpdate;
        Relationships: [];
      };
      media_versions: {
        Row: MediaVersionRow;
        Insert: MediaVersionInsert;
        Update: MediaVersionUpdate;
        Relationships: [];
      };
      media_favorites: {
        Row: MediaFavoriteRow;
        Insert: MediaFavoriteInsert;
        Update: MediaFavoriteUpdate;
        Relationships: [];
      };
      media_collections: {
        Row: MediaCollectionRow;
        Insert: MediaCollectionInsert;
        Update: MediaCollectionUpdate;
        Relationships: [];
      };
      media_collection_items: {
        Row: MediaCollectionItemRow;
        Insert: MediaCollectionItemInsert;
        Update: MediaCollectionItemUpdate;
        Relationships: [];
      };
      gallery_albums: {
        Row: GalleryAlbumRow;
        Insert: GalleryAlbumInsert;
        Update: GalleryAlbumUpdate;
        Relationships: [];
      };
      gallery_photos: {
        Row: GalleryPhotoRow;
        Insert: GalleryPhotoInsert;
        Update: GalleryPhotoUpdate;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      log_audit: {
        Args: {
          p_action: string;
          p_entity_type: string;
          p_entity_id?: string | null;
          p_metadata?: Record<string, unknown>;
        };
        Returns: undefined;
      };
      event_registered_count: {
        Args: { p_event_id: string };
        Returns: number;
      };
      evaluate_member_badges: {
        Args: { p_member?: string | null };
        Returns: number;
      };
      verify_certificate: {
        Args: { p_code: string };
        Returns: {
          certificate_number: string;
          title: string;
          recipient_name: string;
          issued_date: string;
          valid: boolean;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      membership_status: MembershipStatus;
      content_status: ContentStatus;
      registration_status: RegistrationStatus;
      attendance_status: AttendanceStatus;
      achievement_visibility: AchievementVisibility;
      recognition_source: RecognitionSource;
      award_status: AwardStatus;
      suggestion_status: SuggestionStatus;
      suggestion_visibility: SuggestionVisibility;
      suggestion_priority: SuggestionPriority;
    };
    CompositeTypes: Record<never, never>;
  };
};
