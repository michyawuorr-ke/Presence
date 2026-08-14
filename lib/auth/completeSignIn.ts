import { supabase } from "@/lib/supabase/client";

/**
 * Runs after any successful sign-in (magic link OR 6-digit code): links
 * the auth user to master_profiles, then returns where to send them.
 */
export async function completeSignIn(session: any): Promise<string> {
  const authUserId = session.user.id;
  const email = session.user.email?.trim().toLowerCase();
  if (!email) return "/home";

  const { data: existing } = await supabase
    .from("master_profiles")
    .select("id,auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (existing && !existing.auth_user_id) {
    await supabase
      .from("master_profiles")
      .update({ auth_user_id: authUserId })
      .eq("id", existing.id);
  } else if (!existing) {
    await supabase
      .from("master_profiles")
      .insert({ email, auth_user_id: authUserId });
  }

  // iOS "Add to Home Screen" installs run in a storage context that's
  // isolated from Safari — flag a session created outside standalone mode
  // so /home can tell the person to finish by opening the app from their
  // home screen, instead of them silently hitting the login screen again.
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true);

  return isStandalone ? "/home" : "/home?fromBrowser=1";
}
