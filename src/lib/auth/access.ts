import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

// What each role may do through Better Auth's admin API. Admins manage people;
// editors (later) manage content only. Impersonation and hard deletes are
// deliberately not granted to anyone: deactivating a user keeps their history.
export const accessControl = createAccessControl(defaultStatements);

export const roles = {
  admin: accessControl.newRole({
    user: ["create", "list", "set-role", "ban", "get", "update"],
    session: ["list", "revoke"],
  }),
  editor: accessControl.newRole({
    user: [],
    session: [],
  }),
};
