import { base44 } from '@/api/base44Client';

export async function createLogTags(logId, logType, tags) {
  if (!tags || tags.length === 0) return;
  
  const tagLinks = tags.map(tag => ({
    log_type: logType,
    log_id: logId,
    tag_id: tag.id,
    tag_type: tag.tag_type,
    tag_label: tag.label,
  }));

  try {
    await base44.entities.LogsTag.bulkCreate(tagLinks);
  } catch (error) {
    console.error('Failed to create log tags:', error);
  }
}