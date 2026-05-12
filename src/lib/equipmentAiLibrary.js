const EQUIPMENT_TYPE_LABELS = {
  'dish-machine': 'dish machine',
  '3-compartment-sink': 'three compartment sink',
  'hand-sink': 'hand sink',
  'prep-sink': 'prep sink',
  'walk-in-cooler': 'walk in cooler',
  'walk-in-freezer': 'walk in freezer',
  'reach-in-cooler': 'reach in cooler',
  'reach-in-freezer': 'reach in freezer',
  'prep-table-cooler': 'prep table cooler',
  'lowboy-cooler': 'lowboy cooler',
  'beer-cooler': 'beer cooler',
  'wine-cooler': 'wine cooler',
  'chest-freezer': 'chest freezer',
  'ice-machine': 'ice machine',
  fryer: 'commercial fryer',
  'flat-top': 'flat top grill',
  grill: 'restaurant grill',
  oven: 'commercial oven',
  'steam-table': 'steam table',
  'hot-holding-cabinet': 'hot holding cabinet',
  'soda-gun': 'soda gun station',
  'glass-washer': 'glass washer',
  'hood-system': 'kitchen hood system',
  'grease-trap': 'grease trap',
  hvac: 'restaurant hvac unit',
  'water-heater': 'commercial water heater',
  other: 'restaurant kitchen equipment',
};

export function getEquipmentAiPhoto(type = '') {
  if (!type) return '';
  const phrase = EQUIPMENT_TYPE_LABELS[type] || type.replace(/-/g, ' ');
  const prompt = encodeURIComponent(`luxury restaurant ${phrase}, ai generated product photography, clean dramatic lighting, premium cinematic style, no text`);
  return `https://image.pollinations.ai/prompt/${prompt}?width=1024&height=1024&seed=42&model=flux`;
}
