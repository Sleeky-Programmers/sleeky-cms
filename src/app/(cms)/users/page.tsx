import { Suspense } from "react";
import type { Metadata } from "next";
import { InviteActions } from "@/components/users/InviteActions";
import { InviteForm } from "@/components/users/InviteForm";
import { UserActions } from "@/components/users/UserActions";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { listOpenInvitations } from "@/lib/invitations";
import { requireAdmin } from "@/lib/session";
import { listUsers } from "@/lib/users";

export const metadata: Metadata = { title: "Users" };

const dateFormat = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });

export default function UsersPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm uppercase tracking-[0.14em] text-muted">Admin</p>
        <h1 className="mt-3 font-display text-[clamp(36px,5vw,56px)] font-extrabold leading-none tracking-[-0.04em]">Users</h1>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[28px] bg-surface" />}>
        <UsersAdmin />
      </Suspense>
    </div>
  );
}

const card = "rounded-[28px] border border-line bg-surface p-6 sm:p-8";
const th = "px-3 pb-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-muted";
const td = "px-3 py-4 align-top";

async function UsersAdmin() {
  const admin = await requireAdmin();
  const [users, invitations] = await Promise.all([listUsers(), listOpenInvitations()]);

  return (
    <>
      <section aria-labelledby="invite-heading" className={card}>
        <h2 id="invite-heading" className="font-display text-2xl font-bold tracking-tight">Invite someone</h2>
        <p className="mt-1 mb-6 text-muted">They&rsquo;ll get an email with a link to set up their account. Links expire after 7 days.</p>
        <InviteForm />
      </section>

      <section aria-labelledby="invites-heading" className={card}>
        <h2 id="invites-heading" className="font-display text-2xl font-bold tracking-tight">
          Pending invites <span className="text-muted">({invitations.length})</span>
        </h2>
        {invitations.length === 0 ? (
          <p className="mt-3 text-muted">No pending invites.</p>
        ) : (
          <div className="-mx-3 mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[15px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Email</th>
                  <th className={th}>Role</th>
                  <th className={th}>Invited</th>
                  <th className={`${th} text-right`}><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="border-b border-line last:border-0">
                    <td className={td}>
                      <span className="font-medium">{invitation.email}</span>
                      {invitation.status === "expired" && <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">Expired</span>}
                    </td>
                    <td className={td}>{ROLE_LABELS[invitation.role]}</td>
                    <td className={`${td} text-muted`}>
                      {dateFormat.format(invitation.lastSentAt)}
                      {invitation.invitedBy && <span className="block text-sm">by {invitation.invitedBy.name}</span>}
                    </td>
                    <td className={`${td} text-right`}><InviteActions id={invitation.id} email={invitation.email} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="users-heading" className={card}>
        <h2 id="users-heading" className="font-display text-2xl font-bold tracking-tight">
          Team <span className="text-muted">({users.length})</span>
        </h2>
        <div className="-mx-3 mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[15px]">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>Name</th>
                <th className={th}>Role</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-line last:border-0">
                  <td className={td}>
                    <span className="font-medium">{user.name}</span>
                    {user.id === admin.id && <span className="ml-2 text-sm text-muted">(you)</span>}
                    <span className="block text-sm text-muted">{user.email}</span>
                  </td>
                  <td className={td}>{ROLE_LABELS[user.role]}</td>
                  <td className={td}>
                    {user.active ? (
                      <span className="rounded-full bg-green-deep px-2.5 py-1 text-xs font-semibold text-green">Active</span>
                    ) : (
                      <span className="rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">Deactivated</span>
                    )}
                  </td>
                  <td className={`${td} text-right`}>
                    {user.id === admin.id ? (
                      <span className="text-sm text-muted">This is you</span>
                    ) : (
                      <UserActions user={{ id: user.id, name: user.name, role: user.role, active: user.active }} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
