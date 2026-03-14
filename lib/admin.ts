import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAILS = ["realestatephoto2video@gmail.com"];

export async function isAdmin(): Promise<{ isAdmin: boolean; user: any }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { isAdmin: false, user: null };
  
  const admin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");
  return { isAdmin: admin, user };
}
