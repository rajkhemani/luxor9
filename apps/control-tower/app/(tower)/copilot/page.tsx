import { redirect } from "next/navigation";

/** Legacy path — permanently redirected to Luxor-branded Command Bridge. */
export default function LegacyCopilotRedirect() {
  redirect("/command");
}
