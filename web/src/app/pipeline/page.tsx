import { redirect } from "next/navigation";

export default function PipelineRedirect() {
  redirect("/jobs?view=pipeline");
}
