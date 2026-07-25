import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeToasts, dismissToast, type Toast, type ToastKind } from '@getsu/core';
import { useVault } from './store';

const MARK: Record<ToastKind, string> = { error: '!', success: '✓', info: 'i' };

function ToastRow({ toast }: { toast: Toast }) {
  const t = useVault((s) => s.tokens());
  const accent = toast.kind === 'error' ? t.error : toast.kind === 'success' ? t.success : t.accent;

  useEffect(() => {
    if (!toast.duration) return;
    const id = setTimeout(() => dismissToast(toast.id), toast.duration);
    return () => clearTimeout(id);
  }, [toast.id, toast.duration]);

  return (
    <Pressable
      onPress={() => dismissToast(toast.id)}
      accessibilityRole="alert"
      accessibilityLabel={`${toast.message}${toast.detail ? `. ${toast.detail}` : ''}`}
      style={{
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        backgroundColor: t.surface,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
      }}
    >
      <Text style={{ color: accent, fontWeight: '700', width: 12, textAlign: 'center' }}>{MARK[toast.kind]}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: t.text, fontSize: 13.5, fontWeight: '500' }}>{toast.message}</Text>
        {toast.detail ? <Text style={{ color: t.textSoft, fontSize: 12, marginTop: 2 }}>{toast.detail}</Text> : null}
      </View>
    </Pressable>
  );
}

/**
 * Renders the shared toast queue (packages/shared) with native primitives, so a
 * failed AsyncStorage write or sync surfaces here exactly as it does on the web.
 */
export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();
  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 12, right: 12, bottom: insets.bottom + 12, gap: 8 }}
    >
      {toasts.map((t) => <ToastRow key={t.id} toast={t} />)}
    </View>
  );
}
