// Stub AI helpers for training content generation.
// Return mock/placeholder data until real AI integration is wired up.

function makeId() {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function generateTrainingFromText(text, options = {}) {
  const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
  const blocks = lines.slice(0, 12).map((line, i) => ({
    id: makeId(),
    type: i === 0 ? 'text' : 'step',
    title: i === 0 ? (options.title || 'Overview') : `Step ${i}`,
    content: line,
    order: i,
    required: true,
    items: [],
    options: [],
    correctAnswer: 0,
  }));

  return {
    title: options.title || 'Training Module',
    description: lines[0] || '',
    estimatedMinutes: Math.max(5, Math.round(lines.length * 1.5)),
    category: options.category || 'other',
    moduleType: 'reading',
    blocks,
  };
}

export async function generateTrainingFromTask(task) {
  const lines = [
    task.description || '',
    ...(Array.isArray(task.steps) ? task.steps : []),
  ].filter(Boolean);
  return generateTrainingFromText(lines.join('\n'), { title: `How To: ${task.title}` });
}

export async function generateTrainingFromRecipe(recipe) {
  const lines = [
    recipe.description || '',
    ...(Array.isArray(recipe.ingredients) ? recipe.ingredients.map(i => `Ingredient: ${typeof i === 'string' ? i : i.name}`) : []),
    ...(Array.isArray(recipe.steps) ? recipe.steps.map((s, i) => `Step ${i + 1}: ${s}`) : []),
  ].filter(Boolean);
  return generateTrainingFromText(lines.join('\n'), {
    title: `Recipe: ${recipe.name || recipe.title || 'Untitled'}`,
    category: 'food_safety',
  });
}

export async function generateTrainingFromEquipment(equipment) {
  const lines = [
    `Equipment: ${equipment.name}`,
    equipment.description || '',
    equipment.maintenance_notes ? `Maintenance: ${equipment.maintenance_notes}` : '',
    equipment.safety_notes ? `Safety: ${equipment.safety_notes}` : '',
  ].filter(Boolean);
  return generateTrainingFromText(lines.join('\n'), {
    title: `Equipment: ${equipment.name}`,
    category: 'compliance',
  });
}

export async function suggestQuizQuestions(moduleTitle, blocks = []) {
  const contentBlock = blocks.find(b => b.type === 'text' || b.type === 'step');
  return [
    {
      id: makeId(),
      type: 'quiz_question',
      title: 'Knowledge Check',
      content: contentBlock
        ? `Which best describes what you just learned about "${moduleTitle}"?`
        : 'What is the most important takeaway from this training?',
      options: [
        'I understand and can apply this information',
        'I need to review this section again',
        'This does not apply to my role',
        'I have questions I need answered first',
      ],
      correctAnswer: 0,
      order: (blocks.length || 0) + 1,
      required: true,
      items: [],
    },
  ];
}

export async function summarizeTrainingForEmployee(module) {
  return `This training covers "${module.title}". Estimated time: ${module.estimatedMinutes || 15} minutes.`;
}
