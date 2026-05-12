import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import MobileModalWrapper from '@/components/MobileModalWrapper';
import { getCreateTemplate } from '@/lib/createTemplates';

const inputClassName = 'w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary';

function formatOptionLabel(value) {
  return String(value)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function createInitialState(template) {
  const values = { ...template.defaults };
  template.fields.forEach((field) => {
    if (values[field.name] !== undefined) return;
    values[field.name] = field.type === 'checkbox' ? false : '';
  });
  return values;
}

function recordLabel(record, fields = ['name']) {
  return fields
    .map(field => record?.[field])
    .filter(Boolean)
    .join(' · ');
}

function searchableText(record, fields = ['name']) {
  return fields
    .map(field => record?.[field])
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export default function TemplateCreateModal({ templateId, actionType, onClose, onSuccess }) {
  const { user } = useCurrentUser();
  const template = useMemo(() => getCreateTemplate(templateId || actionType), [templateId, actionType]);
  const [values, setValues] = useState(() => template ? createInitialState(template) : {});
  const [saving, setSaving] = useState(false);
  const [recordsByEntity, setRecordsByEntity] = useState({});
  const [queries, setQueries] = useState({});
  const [openPicker, setOpenPicker] = useState(null);

  useEffect(() => {
    if (!template) return;

    const entities = [...new Set(
      template.fields
        .filter(field => field.type === 'record-search' || field.type === 'record-multi-search')
        .map(field => field.entity)
    )];

    if (entities.length === 0) return;

    Promise.all(
      entities.map((entity) => {
        const field = template.fields.find(item => item.entity === entity);
        const sortField = field?.sortBy || field?.displayFields?.[0] || 'name';

        return (base44.entities[entity]?.list?.(sortField, 300) || Promise.resolve([]))
          .then(records => [entity, records || []])
          .catch(() => [entity, []]);
      })
    ).then((results) => {
      setRecordsByEntity(Object.fromEntries(results));
    });
  }, [template]);

  if (!template) return null;

  const setValue = (name, value) => {
    setValues(previous => ({ ...previous, [name]: value }));
  };

  const applyRecordSelection = (field, record) => {
    setValues((previous) => {
      const next = { ...previous };
      Object.entries(field.map || { [field.name]: 'id' }).forEach(([targetKey, sourceKey]) => {
        if (!record) {
          next[targetKey] = '';
          return;
        }
        next[targetKey] = record[sourceKey] ?? '';
      });
      return next;
    });
    setQueries(previous => ({
      ...previous,
      [field.name]: record ? recordLabel(record, field.displayFields) : '',
    }));
    if (record) setOpenPicker(null);
  };

  const toggleMultiRecord = (field, record) => {
    setValues((previous) => {
      const selectedRecords = previous[field.name] || [];
      const isSelected = selectedRecords.some(item => item.id === record.id);
      return {
        ...previous,
        [field.name]: isSelected
          ? selectedRecords.filter(item => item.id !== record.id)
          : [...selectedRecords, record],
      };
    });
  };

  const validate = () => {
    const missingField = template.fields.find(field => field.required && !String(values[field.name] || '').trim());
    if (missingField) {
      toast.error(`${missingField.label} is required`);
      return false;
    }
    return true;
  };

  const fieldNamesByType = (type) => template.fields.filter(field => field.type === type).map(field => field.name);

  const buildPayload = () => {
    const multiRecordFieldNames = fieldNamesByType('record-multi-search');
    const payloadValues = Object.fromEntries(
      Object.entries(values).filter(([key]) => !multiRecordFieldNames.includes(key))
    );

    if (template.entity === 'Task') {
      return {
        ...payloadValues,
        created_by_user: user?.email,
      };
    }

    if (template.entity === 'UnifiedLog') {
      return {
        ...payloadValues,
        created_by: user?.email,
        custom_metadata: {
          manager_log_type: payloadValues.manager_log_type,
          location_id: payloadValues.location_id,
          station_id: payloadValues.station_id,
          station_name: payloadValues.station_name,
          equipment_id: payloadValues.equipment_id,
          equipment_name: payloadValues.equipment_name,
        },
      };
    }

    return payloadValues;
  };

  const createLinkedBEORecords = async (beo) => {
    if (template.entity !== 'BEO' || !beo?.id) return;

    const linkedMenuItems = values.linkedMenuItems || [];
    const linkedPrepItems = values.linkedPrepItems || [];
    const guestCount = Number(values.guestCount) || 1;

    await Promise.all([
      ...linkedMenuItems.map((item, index) => base44.entities.BEOMenuItem.create({
        beoId: beo.id,
        itemName: item.name,
        course: item.category || item.station || '',
        quantity: guestCount,
        unit: 'servings',
        linkedBuildCardId: item.id,
        notes: item.expoNotes || item.platingNotes || '',
        sortOrder: index,
      })),
      ...linkedPrepItems.map((item, index) => base44.entities.BEOPrepItem.create({
        beoId: beo.id,
        prepItem: item.name,
        quantity: guestCount,
        unit: item.yield || '',
        dueDate: values.eventDate || '',
        assignedStation: item.station || '',
        linkedRecipeId: item.id,
        status: 'pending',
        sortOrder: index,
      })),
      values.setupNotes ? base44.entities.BEOTimelineItem.create({
        beoId: beo.id,
        time: values.startTime || '',
        label: 'Setup',
        description: values.setupNotes,
        sortOrder: 0,
      }) : Promise.resolve(),
    ]);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const created = await base44.entities[template.entity].create(buildPayload());
      await createLinkedBEORecords(created);
      toast.success(`${template.successLabel} created`);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(`Failed to create ${template.successLabel.toLowerCase()}`);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <button
        onClick={onClose}
        className="flex-1 h-11 rounded-lg border border-border text-foreground font-bold text-sm hover:bg-secondary active:scale-95 transition-all"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : template.submitLabel}
      </button>
    </>
  );

  const renderField = (field) => {
    const commonLabel = (
      <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
    );

    if (field.type === 'textarea') {
      return (
        <div key={field.name}>
          {commonLabel}
          <textarea
            value={values[field.name] || ''}
            onChange={(event) => setValue(field.name, event.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={inputClassName}
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.name}>
          {commonLabel}
          <select
            value={values[field.name] || ''}
            onChange={(event) => setValue(field.name, event.target.value)}
            className={inputClassName}
          >
            {field.options.map(option => (
              <option key={option} value={option}>{formatOptionLabel(option)}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <label key={field.name} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 min-h-11">
          <input
            type="checkbox"
            checked={Boolean(values[field.name])}
            onChange={(event) => setValue(field.name, event.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
          <span className="text-sm text-muted-foreground">{field.label}</span>
        </label>
      );
    }

    if (field.type === 'record-search') {
      const records = recordsByEntity[field.entity] || [];
      const query = queries[field.name] ?? '';
      const selectedId = values[field.name];
      const selectedSourceKey = field.map?.[field.name] || 'id';
      const selectedRecord = records.find(record => String(record[selectedSourceKey] || '') === String(selectedId || ''));
      const filteredRecords = records
        .filter(record => searchableText(record, field.searchFields).includes(query.toLowerCase()))
        .slice(0, 8);

      return (
        <div key={field.name}>
          {commonLabel}
          <div className="rounded-xl border border-border bg-background/80 p-2">
            <input
              type="text"
              value={selectedRecord ? recordLabel(selectedRecord, field.displayFields) : query}
              onFocus={() => setOpenPicker(field.name)}
              onChange={(event) => {
                applyRecordSelection(field, null);
                setQueries(previous => ({ ...previous, [field.name]: event.target.value }));
                setOpenPicker(field.name);
              }}
              placeholder={field.placeholder || `Search ${field.label.toLowerCase()}`}
              className="w-full bg-transparent px-2 py-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            {field.privacyNote && (
              <p className="px-2 pb-2 text-[11px] font-semibold text-muted-foreground">{field.privacyNote}</p>
            )}
            {openPicker === field.name && !selectedRecord && (
              <div className="max-h-52 overflow-y-auto border-t border-border/50 pt-2">
                {filteredRecords.length > 0 ? filteredRecords.map(record => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => applyRecordSelection(field, record)}
                    className="w-full rounded-lg px-2 py-2 text-left hover:bg-muted/60 active:scale-[0.99]"
                  >
                    <p className="text-sm font-bold text-foreground">{recordLabel(record, field.displayFields)}</p>
                    <p className="text-xs text-muted-foreground">{recordLabel(record, field.searchFields)}</p>
                  </button>
                )) : (
                  <p className="px-2 py-3 text-sm text-muted-foreground">No linked records found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (field.type === 'record-multi-search') {
      const records = recordsByEntity[field.entity] || [];
      const query = queries[field.name] ?? '';
      const selectedRecords = values[field.name] || [];
      const filteredRecords = records
        .filter(record => searchableText(record, field.searchFields).includes(query.toLowerCase()))
        .slice(0, 10);

      return (
        <div key={field.name}>
          {commonLabel}
          <div className="rounded-xl border border-border bg-background/80 p-2">
            <input
              type="text"
              value={query}
              onFocus={() => setOpenPicker(field.name)}
              onChange={(event) => {
                setQueries(previous => ({ ...previous, [field.name]: event.target.value }));
                setOpenPicker(field.name);
              }}
              placeholder={field.placeholder || `Search ${field.label.toLowerCase()}`}
              className="w-full bg-transparent px-2 py-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            {selectedRecords.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2 pb-2">
                {selectedRecords.map(record => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => toggleMultiRecord(field, record)}
                    className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
                  >
                    {recordLabel(record, field.displayFields)}
                  </button>
                ))}
              </div>
            )}
            {openPicker === field.name && (
              <div className="max-h-56 overflow-y-auto border-t border-border/50 pt-2">
                {filteredRecords.length > 0 ? filteredRecords.map(record => {
                  const isSelected = selectedRecords.some(item => item.id === record.id);
                  return (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => toggleMultiRecord(field, record)}
                      className="w-full rounded-lg px-2 py-2 text-left hover:bg-muted/60 active:scale-[0.99]"
                    >
                      <p className="text-sm font-bold text-foreground">
                        {isSelected ? 'Selected · ' : ''}{recordLabel(record, field.displayFields)}
                      </p>
                      <p className="text-xs text-muted-foreground">{recordLabel(record, field.searchFields)}</p>
                    </button>
                  );
                }) : (
                  <p className="px-2 py-3 text-sm text-muted-foreground">No linked records found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={field.name}>
        {commonLabel}
        <input
          type={field.type}
          value={values[field.name] || ''}
          onChange={(event) => setValue(field.name, event.target.value)}
          placeholder={field.placeholder}
          className={inputClassName}
        />
      </div>
    );
  };

  return (
    <MobileModalWrapper
      isOpen={true}
      onClose={onClose}
      title={template.title}
      footer={footer}
    >
      <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
        <p className="metric-label">{template.eyebrow}</p>
      </div>

      {template.fields.map(renderField)}
    </MobileModalWrapper>
  );
}
