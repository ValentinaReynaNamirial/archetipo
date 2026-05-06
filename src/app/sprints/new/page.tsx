import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { Sidebar } from "../Sidebar";
import { SprintForm } from "../SprintForm";
import "../sprints.css";

export const dynamic = "force-dynamic";

export default async function NewSprintPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const userName = user.name ?? user.email ?? "User";
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="oggi-scope">
      <div className="app-shell">
        <Sidebar active="sprints" userName={userName} initials={initials} />
        <main className="main-content">
          <div className="page-container">
            <div className="anim-fade-up">
              <div className="breadcrumb">
                <Link href="/sprints">Sprints</Link>
                <span className="sep">/</span>
                <span>New</span>
              </div>
            </div>
            <SprintForm />
          </div>
        </main>
      </div>
    </div>
  );
}
