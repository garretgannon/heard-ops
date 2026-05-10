const STATIONS = ['Grill', 'Sauté', 'Cold Station', 'Desserts', 'Fryer', 'Pass'];
const PREP_ITEMS = ['Chicken breasts', 'Vegetables', 'Stock', 'Sauces', 'Garnish', 'Proteins'];
const SIDEWORK_TASKS = ['Clean station', 'Restock supplies', 'Check temps', 'Setup mise en place', 'Organize cooler'];

export function generateRoleSimulationData(role) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (role === 'kitchen_lead') {
    return {
      assignedPrep: [
        { id: '1', name: 'Prep chicken for evening service', station: 'Cold Station', dueTime: '14:00', quantity: 40, unit: 'breasts', completed: 8, assignedTo: 'Marcus T.' },
        { id: '2', name: 'Make vegetable stock', station: 'Hot Station', dueTime: '12:00', quantity: 5, unit: 'gallons', completed: 0, assignedTo: 'Sarah L.' },
        { id: '3', name: 'Prep sauces and condiments', station: 'Cold Station', dueTime: '16:00', quantity: 12, unit: 'containers', completed: 3, assignedTo: 'James R.' },
      ],
      staffing: [
        { name: 'Marcus T.', role: 'Prep Cook', station: 'Cold Station', status: 'on-time' },
        { name: 'Sarah L.', role: 'Cook', station: 'Hot Station', status: 'late-5min' },
        { name: 'James R.', role: 'Prep Cook', station: 'Cold Station', status: 'on-time' },
        { name: 'David P.', role: 'Cook', station: 'Grill', status: 'on-time' },
      ],
      stationReadiness: [
        { station: 'Grill', status: 'ready', temp: 375 },
        { station: 'Sauté', status: 'ready', temp: 350 },
        { station: 'Cold Station', status: 'in-progress', temp: 38 },
        { station: 'Fryer', status: 'needs-attention', temp: null },
      ],
      inventoryShortages: [
        { item: 'Premium beef trim', status: 'critical', quantity: 2, unit: 'lbs' },
        { item: 'Fresh herbs', status: 'low', quantity: 1, unit: 'bunch' },
      ],
    };
  }

  if (role === 'server') {
    return {
      assignedTasks: [
        { id: '1', title: 'Set tables for 6pm service', dueTime: '17:30', status: 'pending', station: 'Dining Room' },
        { id: '2', title: 'Stock bar supplies', dueTime: '17:00', status: 'in-progress', station: 'Bar' },
        { id: '3', title: 'Review evening specials', dueTime: '18:00', status: 'pending', station: 'Service' },
      ],
      reservations: [
        { time: '18:00', partySize: 4, name: 'Johnson', notes: 'Anniversary dinner' },
        { time: '19:00', partySize: 2, name: 'Smith', notes: 'Birthday celebration' },
      ],
      sidework: [
        { task: 'Polish glassware', status: 'pending', dueTime: '17:00' },
        { task: 'Fold napkins', status: 'in-progress', dueTime: '17:30' },
      ],
    };
  }

  if (role === 'prep_cook') {
    return {
      assignedPrep: [
        { id: '1', name: 'Prep chicken for service', station: 'Cold Station', dueTime: '15:00', quantity: 20, unit: 'breasts', completed: 8, status: 'in-progress' },
        { id: '2', name: 'Dice vegetables', station: 'Cold Station', dueTime: '14:30', quantity: 5, unit: 'lbs', completed: 2, status: 'in-progress' },
      ],
      assignedSidework: [
        { task: 'Clean prep station', dueTime: '12:00', status: 'completed' },
        { task: 'Organize cold storage', dueTime: '13:00', status: 'pending' },
      ],
      stationNotes: 'Prioritize chicken prep — service staff needs it by 3pm. Stock is low on fresh herbs.',
      tempLogs: [
        { equipment: 'Cold Station', temp: 38, target: '41°F', time: '11:30', status: 'ok' },
      ],
    };
  }

  if (role === 'cook') {
    return {
      assignedTasks: [
        { id: '1', title: 'Station setup - Grill', dueTime: '16:00', status: 'in-progress', station: 'Grill Station' },
        { id: '2', title: 'Test temperatures', dueTime: '16:30', status: 'pending', station: 'Grill Station' },
        { id: '3', title: 'Review evening menu changes', dueTime: '17:00', status: 'pending', station: 'Kitchen' },
      ],
      stationNotes: 'Grill temp target: 375°F. Keep eye on the new marinade — needs to rest 2 hours.',
      recipes: [
        { name: 'House ribeye prep', steps: 4, cookTime: '8 mins', notes: 'Medium-rare internal temp: 130°F' },
      ],
    };
  }

  if (role === 'bartender') {
    return {
      assignedTasks: [
        { id: '1', title: 'Stock bar station', dueTime: '17:00', status: 'in-progress', station: 'Bar' },
        { id: '2', title: 'Check liquor inventory', dueTime: '17:30', status: 'pending', station: 'Bar Back' },
      ],
      buildCards: [
        { name: 'Classic Margarita', glass: 'Rocks', ingredients: ['Tequila', 'Lime Juice', 'Cointreau'], cost: '$8' },
        { name: 'House Old Fashioned', glass: 'Coupe', ingredients: ['Bourbon', 'Sugar', 'Bitters'], cost: '$12' },
      ],
      barReadiness: 'All spirits stocked. Low on fresh citrus — expect delivery by 5pm.',
    };
  }

  if (role === 'manager') {
    return {
      staffingOverview: [
        { name: 'Marcus T.', role: 'Prep Cook', status: 'on-time', shift: 'Lunch' },
        { name: 'Sarah L.', role: 'Cook', status: 'on-time', shift: 'Lunch' },
        { name: 'James R.', role: 'Prep Cook', status: 'on-time', shift: 'Dinner Prep' },
      ],
      operationalAlerts: [
        { type: 'critical', title: 'Fryer not heating', station: 'Hot Station', time: '11:45' },
        { type: 'warning', title: 'Low beef inventory', item: 'Premium trim', quantity: 2, time: '11:30' },
      ],
      reservations: [
        { time: '18:00', partySize: 8, name: 'Corporate Event', status: 'confirmed' },
        { time: '19:30', partySize: 2, name: 'Walk-in', status: 'pending' },
      ],
      taskCompletion: 65,
      prepCompletion: 58,
    };
  }

  return {};
}