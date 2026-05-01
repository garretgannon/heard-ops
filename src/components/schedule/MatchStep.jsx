import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, AlertCircle, UserCircle } from "lucide-react";

const ROLE_MAPPINGS_DEFAULT = {
  "am server": "server", "pm server": "server", "server": "server",
  "bartender": "bartender", "am bar": "bartender", "pm bar": "bartender", "bar": "bartender",
  "busser": "busser", "host": "host", "hostess": "host",
  "cook": "cook", "line cook": "cook", "prep cook": "cook", "prep": "cook",
  "dishwasher": "dishwasher", "dish": "dishwasher",
  "manager": "manager", "mod": "manager", "floor manager": "manager"
};

const DEPT_ROLES = {
  server: "FOH", bartender: "Bar", busser: "FOH", host: "FOH",
  cook: "BOH", dishwasher: "BOH", manager: "Management"
};

function similarity(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.8;
  const wordsA = a.split(/\s+/); const wordsB = b.split(/\s+/);
  const shared = wordsA.filter(w => wordsB.some(wb => wb.startsWith(w[0]) && Math.abs(wb.length - w.length) < 3));
  return shared.length / Math.max(wordsA.length, wordsB.length);
}

export default function MatchStep({ rows, onNext, onBack }) {
  const [users, setUsers] = useState([]);
  const [savedMappings, setSavedMappings] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({});
  const [roleMap, setRoleMap] = useState({});
  const [loading, setLoading] = useState(true);

  const uniqueNames = [...new Set(rows.map(r => r.employee_name).filter(Boolean))];
  const uniqueRoles = [...new Set(rows.map(r => r.role).filter(Boolean))];

  useEffect(() => {
    Promise.all([
      base44.entities.User.list(),
      base44.entities.ScheduleMapping.list()
    ]).then(([u, m]) => {
      setUsers(u);
      setSavedMappings(m);
      // Auto-match employees
      const empMap = {};
      uniqueNames.forEach(name => {
        const saved = m.find(x => x.type === "employee" && x.source_name.toLowerCase() === name.toLowerCase());
        if (saved) { empMap[name] = saved.mapped_to; return; }
        const exact = u.find(x => x.full_name?.toLowerCase() === name.toLowerCase());
        if (exact) { empMap[name] = exact.email; return; }
        const best = u.map(x => ({ email: x.email, score: similarity(name, x.full_name || "") }))
          .sort((a, b) => b.score - a.score)[0];
        if (best && best.score > 0.5) empMap[name] = best.email;
        else empMap[name] = "new";
      });
      // Auto-map roles
      const rMap = {};
      uniqueRoles.forEach(role => {
        const saved = m.find(x => x.type === "role" && x.source_name.toLowerCase() === role.toLowerCase());
        if (saved) { rMap[role] = saved.mapped_to; return; }
        rMap[role] = ROLE_MAPPINGS_DEFAULT[role.toLowerCase()] || role.toLowerCase();
      });
      setEmployeeMap(empMap);
      setRoleMap(rMap);
      setLoading(false);
    });
  }, []);

  const handleNext = async () => {
    // Save new mappings
    const existing = savedMappings;
    for (const [name, email] of Object.entries(employeeMap)) {
      if (!existing.find(x => x.type === "employee" && x.source_name === name)) {
        const user = users.find(u => u.email === email);
        await base44.entities.ScheduleMapping.create({
          type: "employee", source_name: name, mapped_to: email,
          mapped_display: user?.full_name || email
        }).catch(() => {});
      }
    }
    for (const [role, mapped] of Object.entries(roleMap)) {
      if (!existing.find(x => x.type === "role" && x.source_name === role)) {
        await base44.entities.ScheduleMapping.create({
          type: "role", source_name: role, mapped_to: mapped, mapped_display: mapped
        }).catch(() => {});
      }
    }
    // Apply mappings to rows
    const enriched = rows.map(row => {
      const email = employeeMap[row.employee_name] === "new" ? "" : employeeMap[row.employee_name] || "";
      const user = users.find(u => u.email === email);
      const mappedRole = roleMap[row.role] || row.role || "";
      const dept = row.department || DEPT_ROLES[mappedRole] || "";
      return { ...row, employee_email: email, employee_name: user?.full_name || row.employee_name, role: mappedRole, department: dept };
    });
    onNext(enriched);
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading team members...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Match schedule names to your team members and map roles to app roles.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
          <Button size="sm" onClick={handleNext}>Continue</Button>
        </div>
      </div>

      {/* Employee matching */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2"><UserCircle className="h-4 w-4 text-primary" />Employee Matching</h3>
        <div className="space-y-2">
          {uniqueNames.map(name => {
            const matched = employeeMap[name];
            const user = users.find(u => u.email === matched);
            return (
              <div key={name} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="w-40 text-sm font-medium truncate">{name}</div>
                <div className="text-muted-foreground text-xs">→</div>
                <Select value={matched || "new"} onValueChange={v => setEmployeeMap(m => ({ ...m, [name]: v }))}>
                  <SelectTrigger className="flex-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ New Employee</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.email} value={u.email}>{u.full_name} ({u.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {matched && matched !== "new"
                  ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  : <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Role mapping */}
      {uniqueRoles.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Role Mapping</h3>
          <div className="space-y-2">
            {uniqueRoles.map(role => (
              <div key={role} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="w-40 text-sm font-medium truncate">{role}</div>
                <div className="text-muted-foreground text-xs">→</div>
                <Select value={roleMap[role] || "other"} onValueChange={v => setRoleMap(m => ({ ...m, [role]: v }))}>
                  <SelectTrigger className="flex-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["server","bartender","busser","host","cook","dishwasher","manager","other"].map(r => (
                      <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}