import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DUMMY_TEAM = [
  { email: "chef.sarah@restaurant.local", name: "Sarah Johnson", role: "admin", department: "BOH", phone: "(602) 555-0101", certifications: "ServSafe,HACCP", status: "active" },
  { email: "jason.foh@restaurant.local", name: "Jason Martinez", role: "user", department: "FOH", phone: "(602) 555-0102", certifications: "ServSafe,Mixology", status: "active" },
  { email: "maria.line@restaurant.local", name: "Maria Rodriguez", role: "user", department: "BOH", phone: "(602) 555-0103", certifications: "ServSafe", status: "active" },
  { email: "david.prep@restaurant.local", name: "David Chen", role: "user", department: "BOH", phone: "(602) 555-0104", certifications: "ServSafe,Food Handler", status: "active" },
  { email: "emily.bar@restaurant.local", name: "Emily Walker", role: "user", department: "Bar", phone: "(602) 555-0105", certifications: "TIPS,ServSafe", status: "active" },
  { email: "tom.busser@restaurant.local", name: "Tom Anderson", role: "user", department: "FOH", phone: "(602) 555-0106", certifications: "", status: "active" },
  { email: "alex.manager@restaurant.local", name: "Alex Thompson", role: "admin", department: "FOH", phone: "(602) 555-0107", certifications: "ServSafe,Management Cert", status: "active" },
  { email: "rachel.pastry@restaurant.local", name: "Rachel Brown", role: "user", department: "BOH", phone: "(602) 555-0108", certifications: "ServSafe", status: "active" },
  { email: "marcus.sous@restaurant.local", name: "Marcus Lee", role: "user", department: "BOH", phone: "(602) 555-0109", certifications: "ServSafe,Food Handler", status: "active" },
  { email: "olivia.server@restaurant.local", name: "Olivia Davis", role: "user", department: "FOH", phone: "(602) 555-0110", certifications: "ServSafe,TIPS", status: "active" },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const invited = [];
    const users = await base44.entities.User.list();
    
    for (const member of DUMMY_TEAM) {
      const existing = users.find(u => u.email === member.email);
      if (!existing) {
        await base44.users.inviteUser(member.email, member.role);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const user = existing || { email: member.email };
      const updateData = {
        department: member.department,
        phone: member.phone,
        certifications: member.certifications,
        status: member.status,
      };
      
      if (user.id) {
        await base44.entities.User.update(user.id, updateData);
      }
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