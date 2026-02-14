import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import type { FootprintInput } from '@/types/footprint';

interface CategoryField {
  key: string;
  unit: string;
  displayUnit?: string;
  labelKey: string;
  placeholderKey?: string;
  metadata?: Record<string, unknown>;
}

interface CategoryInputCardProps {
  category: string;
  fields: CategoryField[];
  onSave: (inputs: FootprintInput[], category: FootprintInput['category']) => void;
  initialValues?: Record<string, number>;
}

export function CategoryInputCard({ category, fields, onSave, initialValues = {} }: CategoryInputCardProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, number>>(initialValues);

  const handleChange = (key: string, value: string) => {
    const num = parseFloat(value) || 0;
    const newValues = { ...values, [key]: num };
    setValues(newValues);

    const inputs: FootprintInput[] = fields
      .filter((f) => (newValues[f.key] || 0) > 0)
      .map((f) => ({
        category: category as FootprintInput['category'],
        unit: f.unit,
        value: newValues[f.key] || 0,
        metadata: f.metadata ?? { subcategory: f.key },
      }));
    onSave(inputs, category as FootprintInput['category']);
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <Input
          key={field.key}
          id={field.key}
          type="number"
          min="0"
          step="0.01"
          label={t(field.labelKey)}
          suffix={field.displayUnit ?? field.unit}
          value={values[field.key] || ''}
          onChange={(e) => handleChange(field.key, e.target.value)}
          placeholder={field.placeholderKey ? t(field.placeholderKey) : '0'}
        />
      ))}
    </div>
  );
}
