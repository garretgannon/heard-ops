// Cross-module hook that exposes the current day's schedule data.
// Other modules (Pulse, Tasks, Logs, Prep) can import this to know:
// - who is working
// - what station they're assigned to
// - whether a station is covered
// - what the open shifts are

import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

export function useScheduleData({ date = null } = {}) {
  const [shifts, setShifts] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  const targetDate = date || format(new Date(), 'yyyy-MM-dd');

  const load = useCallback(async () => {
    setLoading(true);
    const [allShifts, allStations] = await Promise.all([
      base44.entities.StaffShift?.list?.('-date', 500).catch(() => []),
      base44.entities.Station?.list?.().catch(() => []),
    ]);
    const dayShifts = (allShifts || []).filter(s => s.date === targetDate);
    setShifts(dayShifts);
    setStations(allStations || []);
    setLoading(false);
  }, [targetDate]);

  useEffect(() => { load(); }, [load]);

  const shiftsByStation = shifts.reduce((acc, s) => {
    const key = s.station || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const shiftsByEmployee = shifts.reduce((acc, s) => {
    const key = s.employee_email || s.employee_name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const publishedShifts = shifts.filter(s => s.status === 'published' || s.status !== 'draft');
  const openShifts = publishedShifts.filter(s => !s.employee_email && !s.employee_name);
  const coveredStations = [...new Set(publishedShifts.filter(s => s.station && (s.employee_email || s.employee_name)).map(s => s.station))];

  const getStationShifts = (stationName) => shiftsByStation[stationName] || [];
  const getEmployeeShifts = (email) => shifts.filter(s => s.employee_email === email);
  const isStationCovered = (stationName) => coveredStations.includes(stationName);

  // Summary card data for Pulse, Dashboard, etc.
  const summary = {
    totalShifts: shifts.length,
    staffWorking: new Set(shifts.filter(s => s.employee_email).map(s => s.employee_email)).size,
    coveredStationCount: coveredStations.length,
    openShiftCount: openShifts.length,
    date: targetDate,
  };

  return {
    shifts,
    stations,
    loading,
    shiftsByStation,
    shiftsByEmployee,
    coveredStations,
    openShifts,
    summary,
    getStationShifts,
    getEmployeeShifts,
    isStationCovered,
    reload: load,
  };
}
