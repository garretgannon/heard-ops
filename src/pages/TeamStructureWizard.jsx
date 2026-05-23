import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { base44 } from '@/api/base44Client';
import WizardProgress from '@/components/teamSetup/WizardProgress';
import Step0_Intro from '@/components/teamSetup/Step0_Intro';
import Step1_Departments from '@/components/teamSetup/Step1_Departments';
import Step2_JobCodes from '@/components/teamSetup/Step2_JobCodes';
import Step3_Roles from '@/components/teamSetup/Step3_Roles';
import Step4_StationLinks from '@/components/teamSetup/Step4_StationLinks';
import Step5_Responsibilities from '@/components/teamSetup/Step5_Responsibilities';
import Step6_Access from '@/components/teamSetup/Step6_Access';
import Step7_ViewAs from '@/components/teamSetup/Step7_ViewAs';
import Step8_Review from '@/components/teamSetup/Step8_Review';

const TOTAL_STEPS = 9;

export default function TeamStructureWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [stations, setStations] = useState([]);

  const [wizardData, setWizardData] = useState({
    departments: [],
    jobCodes: [],
    roles: [],
    stationLinks: {},
    responsibilities: {},
    access: {},
    customStations: [], // stations added in this wizard (not yet in DB)
  });

  // Load stations on mount
  useEffect(() => {
    base44.entities.Station.list()
      .then((data) => setStations(data || []))
      .catch(() => setStations([]));
  }, []);

  function update(key, value) {
    setWizardData((prev) => ({ ...prev, [key]: value }));
  }

  function goNext() {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  function goToStep(n) {
    setStep(n);
  }

  async function handleFinish() {
    setFinishing(true);
    try {
      // 1. Save departments to Settings
      const deptKey = 'team_setup_departments';
      const existingDepts = await base44.entities.Settings.filter({ key: deptKey }).catch(() => []);
      const deptPayload = { key: deptKey, value: JSON.stringify(wizardData.departments) };
      if (existingDepts && existingDepts.length > 0) {
        await base44.entities.Settings.update(existingDepts[0].id, deptPayload);
      } else {
        await base44.entities.Settings.create(deptPayload);
      }

      // 2. Create custom stations from wizard, build ID map for link remapping
      const idMap = {}; // wizard local id → real db id
      await Promise.all(
        wizardData.customStations.map(async (s) => {
          const created = await base44.entities.Station.create({ name: s.name, isActive: true }).catch(() => null);
          if (created?.id) idMap[s.id] = created.id;
        })
      );

      // Remap stationLinks: replace wizard_ IDs with real DB IDs
      const remappedLinks = {};
      Object.entries(wizardData.stationLinks).forEach(([jcId, sIds]) => {
        remappedLinks[jcId] = sIds.map((sid) => idMap[sid] ?? sid);
      });

      // 3. Create JobCode records
      await Promise.all(
        wizardData.jobCodes.map((jc) =>
          base44.entities.JobCode.create({
            name: jc.name,
            department: jc.department,
            description: jc.description || '',
            isActive: true,
          }).catch(() => null)
        )
      );

      // 4. Create Role records
      await Promise.all(
        wizardData.roles.map((r) =>
          base44.entities.Role.create({
            name: r.name,
            department: r.level,
            is_active: true,
            can_approve_tasks: r.level === 'manager' || r.level === 'admin',
            can_close_shift: r.level === 'lead' || r.level === 'manager' || r.level === 'admin',
            can_create_issues: true,
          }).catch(() => null)
        )
      );

      // 5. Save station links to Settings (with remapped IDs)
      const slKey = 'team_setup_station_links';
      const existingSL = await base44.entities.Settings.filter({ key: slKey }).catch(() => []);
      const slPayload = { key: slKey, value: JSON.stringify(remappedLinks) };
      if (existingSL && existingSL.length > 0) {
        await base44.entities.Settings.update(existingSL[0].id, slPayload);
      } else {
        await base44.entities.Settings.create(slPayload);
      }

      // 5. Save responsibilities to Settings
      const respKey = 'team_setup_responsibilities';
      const existingResp = await base44.entities.Settings.filter({ key: respKey }).catch(() => []);
      const respPayload = { key: respKey, value: JSON.stringify(wizardData.responsibilities) };
      if (existingResp && existingResp.length > 0) {
        await base44.entities.Settings.update(existingResp[0].id, respPayload);
      } else {
        await base44.entities.Settings.create(respPayload);
      }

      // 6. Save access to Settings
      const accessKey = 'team_setup_access';
      const existingAccess = await base44.entities.Settings.filter({ key: accessKey }).catch(() => []);
      const accessPayload = { key: accessKey, value: JSON.stringify(wizardData.access) };
      if (existingAccess && existingAccess.length > 0) {
        await base44.entities.Settings.update(existingAccess[0].id, accessPayload);
      } else {
        await base44.entities.Settings.create(accessPayload);
      }

      // 6b. Translate wizard access rules → role_permissions_* so PermissionGate enforces them
      if (Object.keys(wizardData.access).length > 0) {
        const MODULE_PERMS = {
          today:    ['view_dashboard'],
          tasks:    ['complete_tasks'],
          schedule: ['view_schedule'],
          logs:     ['view_logs', 'submit_logs'],
          training: ['view_training'],
          stations: ['view_station_readiness'],
          people:   ['view_team'],
          reports:  ['view_reports'],
          settings: ['manage_settings'],
        };
        const MANAGER_ROLES = ['admin', 'general_manager', 'manager'];
        const ALL_SYS_ROLES = ['admin', 'general_manager', 'manager', 'kitchen_lead', 'cook', 'server', 'bartender', 'host', 'dishwasher'];
        const overrides = {};
        ALL_SYS_ROLES.forEach(r => { overrides[r] = {}; });
        Object.entries(wizardData.access).forEach(([module, state]) => {
          const perms = MODULE_PERMS[module];
          if (!perms) return;
          perms.forEach(perm => {
            ALL_SYS_ROLES.forEach(r => {
              if (state === 'visible') overrides[r][perm] = true;
              else if (state === 'locked') overrides[r][perm] = MANAGER_ROLES.includes(r);
              else overrides[r][perm] = false;
            });
          });
        });
        await Promise.all(
          ALL_SYS_ROLES.map(async (r) => {
            const key = `role_permissions_${r}`;
            const existing = await base44.entities.Settings.filter({ key }).catch(() => []);
            const payload = { key, value: JSON.stringify(overrides[r]) };
            if (existing && existing.length > 0) await base44.entities.Settings.update(existing[0].id, payload).catch(() => {});
            else await base44.entities.Settings.create(payload).catch(() => {});
          })
        );
      }

      // 7. Set completion flag
      const flagKey = 'team_structure_onboarding_completed';
      const existingFlag = await base44.entities.Settings.filter({ key: flagKey }).catch(() => []);
      const flagPayload = { key: flagKey, value: 'true' };
      if (existingFlag && existingFlag.length > 0) {
        await base44.entities.Settings.update(existingFlag[0].id, flagPayload);
      } else {
        await base44.entities.Settings.create(flagPayload);
      }

      toast.success('Team structure saved! Welcome to heardOS.');
      navigate('/setup-journey');
    } catch (err) {
      console.error('Setup error:', err);
      toast.error('Something went wrong saving your setup. Please try again.');
    } finally {
      setFinishing(false);
    }
  }

  const stepProps = {
    onNext: goNext,
    onBack: goBack,
  };

  const STEP_LABELS = ['Welcome','Departments','Job Codes','Roles','Stations','Responsibilities','Access','Preview','Review'];

  return (
    <div className="pb-24 lg:pb-10">

      {/* Mobile progress strip */}
      <div className="lg:hidden flex items-center justify-between py-2 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs text-white/40 font-medium">Step {step + 1} of {TOTAL_STEPS}</span>
        <span className="text-xs font-semibold" style={{ color: '#FF6B00' }}>{STEP_LABELS[step]}</span>
        <div className="w-20 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-1 rounded-full transition-all" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%`, background: '#FF6B00' }} />
        </div>
      </div>

      {/* Desktop title row */}
      <div className="hidden lg:flex items-center gap-3 mb-6">
        <h1 className="text-[15px] font-bold text-foreground/90 tracking-wide">Team Setup</h1>
        <span className="text-muted-foreground/30 text-sm">·</span>
        <p className="text-[13px] text-muted-foreground/60">{STEP_LABELS[step]}</p>
      </div>

      {/* 3-zone layout: rail | content | summary */}
      <div className="flex gap-6">
        {/* Left progress rail (desktop only) */}
        <div className="hidden lg:block">
          <WizardProgress step={step} />
        </div>

        {/* Center content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <Step0_Intro key="step0" onNext={goNext} />
            )}
            {step === 1 && (
              <Step1_Departments
                key="step1"
                departments={wizardData.departments}
                onChange={(v) => update('departments', v)}
                {...stepProps}
              />
            )}
            {step === 2 && (
              <Step2_JobCodes
                key="step2"
                jobCodes={wizardData.jobCodes}
                departments={wizardData.departments}
                onChange={(v) => update('jobCodes', v)}
                {...stepProps}
              />
            )}
            {step === 3 && (
              <Step3_Roles
                key="step3"
                roles={wizardData.roles}
                onChange={(v) => update('roles', v)}
                {...stepProps}
              />
            )}
            {step === 4 && (
              <Step4_StationLinks
                key="step4"
                jobCodes={wizardData.jobCodes}
                stationLinks={wizardData.stationLinks}
                stations={stations}
                customStations={wizardData.customStations}
                onStationsChange={(v) => update('customStations', v)}
                onChange={(v) => update('stationLinks', v)}
                {...stepProps}
              />
            )}
            {step === 5 && (
              <Step5_Responsibilities
                key="step5"
                jobCodes={wizardData.jobCodes}
                responsibilities={wizardData.responsibilities}
                onChange={(v) => update('responsibilities', v)}
                {...stepProps}
              />
            )}
            {step === 6 && (
              <Step6_Access
                key="step6"
                access={wizardData.access}
                roles={wizardData.roles}
                onChange={(v) => update('access', v)}
                {...stepProps}
              />
            )}
            {step === 7 && (
              <Step7_ViewAs
                key="step7"
                jobCodes={wizardData.jobCodes}
                roles={wizardData.roles}
                access={wizardData.access}
                responsibilities={wizardData.responsibilities}
                {...stepProps}
              />
            )}
            {step === 8 && (
              <Step8_Review
                key="step8"
                wizardData={wizardData}
                onFinish={handleFinish}
                onGoToStep={goToStep}
                finishing={finishing}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Right panel: summary or step-7 info (desktop only) */}
        <aside className="hidden lg:flex w-[260px] shrink-0 flex-col gap-4 pt-2">
          {step > 0 && step < 8 && (
            <div
              className="p-4 rounded-xl flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, position: 'sticky', top: 100 }}
            >
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Setup Progress</p>

              {wizardData.departments.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Departments</p>
                  <div className="flex flex-wrap gap-1">
                    {wizardData.departments.map((d) => (
                      <span key={d.id} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,107,0,0.12)', color: '#FF6B00' }}>
                        {d.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {wizardData.jobCodes.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Job Codes ({wizardData.jobCodes.length})</p>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {wizardData.jobCodes.slice(0, 5).map((j) => j.name).join(', ')}
                    {wizardData.jobCodes.length > 5 && ` +${wizardData.jobCodes.length - 5} more`}
                  </p>
                </div>
              )}

              {wizardData.roles.length > 0 && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Roles ({wizardData.roles.length})</p>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {wizardData.roles.map((r) => r.name).join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
