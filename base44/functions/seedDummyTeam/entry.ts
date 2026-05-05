import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DUMMY_TEAM = [
  { email: "chef.sarah@restaurant.local", name: "Sarah", role: "admin", department: "BOH" },
  { email: "jason.foh@restaurant.local", name: "Jason", role: "foh", department: "FOH" },
  { email: "maria.line@restaurant.local", name: "Maria", role: "user", department: "BOH" },
  { email: "david.prep@restaurant.local", name: "David", role: "user", department: "BOH" },
  { email: "emily.bar@restaurant.local", name: "Emily", role: "user", department: "Bar" },
  { email: "tom.busser@restaurant.local", name: "Tom", role: "busser", department: "FOH" },
  { email: "alex.manager@restaurant.local", name: "Alex", role: "admin", department: "FOH" },
  { email: "rachel.pastry@restaurant.local", name: "Rachel", role: "user", department: "BOH" },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const invited = [];
    for (const member of DUMMY_TEAM) {
      await base44.users.inviteUser(member.email, member.role);
      invited.push({ email: member.email, role: member.role });
    }

    return Response.json({
      success: true,
      message: `Invited ${invited.length} team members`,
      invited,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});