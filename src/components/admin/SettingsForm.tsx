'use client';

import { AdminForm } from './AdminForm';
import { TextField, TextAreaField } from '@/components/ui/Field';
import { saveSettingsAction } from '@/app/(admin)/admin/actions';

export interface SettingDefinition { key: string; label: string; group: string; multiline?: boolean }

export function SettingsForm({
  definitions, values,
}: { definitions: SettingDefinition[]; values: Record<string, string> }) {
  const groups = Array.from(new Set(definitions.map((d) => d.group)));

  return (
    <AdminForm action={saveSettingsAction} submitLabel="Save settings">
      {(errors) => (
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group} className="card space-y-4 p-4 sm:p-5">
              <h2 className="text-base font-bold">{group}</h2>
              {definitions
                .filter((definition) => definition.group === group)
                .map((definition) =>
                  definition.multiline ? (
                    <TextAreaField
                      key={definition.key}
                      name={definition.key}
                      label={definition.label}
                      rows={5}
                      defaultValue={values[definition.key] ?? ''}
                      error={errors[definition.key]}
                    />
                  ) : (
                    <TextField
                      key={definition.key}
                      name={definition.key}
                      label={definition.label}
                      defaultValue={values[definition.key] ?? ''}
                      error={errors[definition.key]}
                    />
                  ),
                )}
            </section>
          ))}
        </div>
      )}
    </AdminForm>
  );
}
