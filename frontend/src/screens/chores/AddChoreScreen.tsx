import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import {
  AppHeader,
  Button,
  ChipRow,
  ConfirmDialog,
  DateField,
  Input,
  MemberSelect,
  Screen,
  SelectField,
} from '../../components';
import { CHORE_PRIORITIES, CHORE_RECURRENCES, CHORE_TEMPLATES } from '../../constants';
import { useAuth, useHousehold, useHouseholdData, useToast } from '../../hooks';
import { colors, radius, spacing, typography } from '../../theme';
import type { ChorePriority, ChoreRecurrence } from '../../types';
import type { AppScreenProps } from '../../navigation/types';

const POINT_OPTIONS = [5, 10, 15, 20, 30];

export const AddChoreScreen = ({ navigation, route }: AppScreenProps<'AddChore'>) => {
  const choreId = route.params?.choreId;
  const isEditing = Boolean(choreId);

  const { user } = useAuth();
  const { members } = useHousehold();
  const { chores, addChore, editChore, deleteChore } = useHouseholdData();
  const { showSuccess, showError } = useToast();

  const existing = useMemo(
    () => chores.find((chore) => chore.id === choreId),
    [chores, choreId],
  );

  const [title, setTitle] = useState(() => existing?.title ?? '');
  const [description, setDescription] = useState(() => existing?.description ?? '');
  const [assignedTo, setAssignedTo] = useState<string>(
    () => existing?.assignedTo ?? user?.id ?? '',
  );
  const [hasDueDate, setHasDueDate] = useState(() =>
    existing ? Boolean(existing.dueDate) : true,
  );
  const [dueDate, setDueDate] = useState<Date>(() => {
    if (existing?.dueDate) return new Date(existing.dueDate);
    const date = new Date();
    date.setHours(20, 0, 0, 0);
    return date;
  });
  const [priority, setPriority] = useState<ChorePriority>(() => existing?.priority ?? 'medium');
  const [recurrence, setRecurrence] = useState<ChoreRecurrence>(
    () => existing?.recurrence ?? 'none',
  );
  const [points, setPoints] = useState(() => existing?.points ?? 10);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const applyTemplate = (template: (typeof CHORE_TEMPLATES)[number]) => {
    setTitle(template.title);
    setPoints(template.points);
    setError(undefined);
  };

  const submit = async () => {
    if (title.trim().length < 2) {
      setError('Görev başlığı en az 2 karakter olmalı');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        assignedTo: assignedTo || null,
        dueDate: hasDueDate ? dueDate.toISOString() : undefined,
        priority,
        recurrence,
        points,
      };

      if (isEditing && choreId) {
        await editChore(choreId, payload);
        showSuccess('Görev güncellendi');
      } else {
        await addChore(payload);
        showSuccess('Görev oluşturuldu');
      }
      navigation.goBack();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Görev kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!choreId) return;
    setSaving(true);
    try {
      await deleteChore(choreId);
      showSuccess('Görev silindi');
      navigation.goBack();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Görev silinemedi');
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Screen scrollable keyboardAvoiding>
      <AppHeader
        title={isEditing ? 'Görevi düzenle' : 'Yeni görev'}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.form}>
        {!isEditing ? (
          <View style={styles.templates}>
            <Text style={styles.label}>Hızlı seçim</Text>
            <View style={styles.templateRow}>
              {CHORE_TEMPLATES.map((template) => (
                <Pressable
                  key={template.title}
                  onPress={() => applyTemplate(template)}
                  style={({ pressed }) => [
                    styles.template,
                    title === template.title && styles.templateActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      title === template.title && { color: colors.primary },
                    ]}
                  >
                    {template.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <Input
          label="Görev"
          placeholder="Örn. Salon temizliği"
          icon="clipboard-outline"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            setError(undefined);
          }}
          error={error}
        />

        <MemberSelect
          label="Kime atansın?"
          members={members}
          value={assignedTo || null}
          onChange={setAssignedTo}
          allowNone
          noneLabel="Boşta"
        />

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={typography.bodyStrong}>Son tarih belirle</Text>
            <Text style={typography.caption}>
              Tarih verirsen zamanı yaklaşınca hatırlatma gönderilir.
            </Text>
          </View>
          <Switch
            value={hasDueDate}
            onValueChange={setHasDueDate}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>

        {hasDueDate ? (
          <DateField label="Son tarih" value={dueDate} onChange={setDueDate} />
        ) : null}

        <View style={styles.group}>
          <Text style={styles.label}>Öncelik</Text>
          <ChipRow
            options={CHORE_PRIORITIES.map((item) => ({
              key: item.key,
              label: item.label,
              color: item.color,
            }))}
            value={priority}
            onChange={setPriority}
            scrollable={false}
          />
        </View>

        <SelectField
          label="Tekrar"
          value={recurrence}
          onChange={setRecurrence}
          options={CHORE_RECURRENCES.map((item) => ({
            key: item.key,
            label: item.label,
            description:
              item.days > 0
                ? 'Tamamlandığında bir sonraki tekrar otomatik oluşturulur'
                : 'Tek seferlik görev',
          }))}
          sheetTitle="Görev ne sıklıkla tekrarlansın?"
          icon="repeat"
        />

        <View style={styles.group}>
          <Text style={styles.label}>Katkı puanı</Text>
          <ChipRow
            options={POINT_OPTIONS.map((value) => ({
              key: String(value),
              label: `${value} puan`,
            }))}
            value={String(points)}
            onChange={(value) => setPoints(Number(value))}
          />
          <Text style={styles.hint}>
            Puanlar katkı sıralamasında kullanılır; zorlu işlere yüksek puan ver.
          </Text>
        </View>

        <Input
          label="Açıklama (isteğe bağlı)"
          placeholder="Detay veya alınacaklar listesi…"
          value={description}
          onChangeText={setDescription}
          multiline
          multilineHeight={84}
        />

        <Button
          label={isEditing ? 'Değişiklikleri kaydet' : 'Görevi oluştur'}
          onPress={submit}
          loading={saving}
          size="lg"
          fullWidth
        />

        {isEditing ? (
          <Button
            label="Görevi sil"
            onPress={() => setConfirmDelete(true)}
            variant="secondary"
            icon="trash-outline"
            fullWidth
          />
        ) : null}
      </View>

      <ConfirmDialog
        visible={confirmDelete}
        title="Görev silinsin mi?"
        message="Bu işlem geri alınamaz."
        confirmLabel="Sil"
        destructive
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  group: { gap: spacing.sm },
  templates: { gap: spacing.sm },
  templateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  template: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  templateActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
});
