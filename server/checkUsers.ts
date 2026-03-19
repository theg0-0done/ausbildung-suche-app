import "dotenv/config";
import { supabase } from "./src/db.js";

async function main() {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, email_notifications, bereich");

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  console.log("Total Users in DB:", data?.length);
  console.log("Users configured to receive emails:");
  data?.forEach((user) => {
    if (user.email_notifications && user.bereich) {
      console.log(`- ${user.email} (bereich: ${user.bereich})`);
    } else {
      console.log(`[SKIP] ${user.email} (notifications: ${user.email_notifications}, bereich: ${user.bereich})`);
    }
  });
}

main();
