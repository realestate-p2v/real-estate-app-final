import { createAdminClient } from "@/lib/supabase/admin";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  metadata,
}: {
  userId: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message: message || null,
      link: link || null,
      metadata: metadata || {},
    });

    if (error) {
      console.error("Failed to create notification:", error);
    }
  } catch (err) {
    console.error("Notification creation error:", err);
  }
}
