import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchViewer } from '../api/github';
import { useToken } from '../hooks/useToken';
import { colors, fonts } from '../theme';

export function SettingsScreen({ onDone }: { onDone?: () => void }) {
  const { token, setToken } = useToken();
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(
    null
  );

  const save = async () => {
    const candidate = input.trim();
    if (!candidate) {
      setStatus({ kind: 'error', message: 'Token field is empty — paste your token first.' });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const viewer = await fetchViewer(candidate);
      setToken(candidate);
      setInput('');
      setStatus({ kind: 'success', message: `Signed in as ${viewer.login}` });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not validate token',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Settings</Text>
        {token && onDone ? (
          <Pressable onPress={onDone} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Done</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>GitHub Personal Access Token</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={token ? 'Token saved — paste to replace' : 'ghp_…'}
            placeholderTextColor={colors.neutral500}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            onSubmitEditing={save}
          />
          <Pressable onPress={save} disabled={saving} style={styles.saveButton}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.bg} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </Pressable>
        </View>
        <Text style={styles.counterText}>{input.length} characters entered</Text>
        {status ? (
          <Text style={status.kind === 'error' ? styles.errorText : styles.successText}>
            {status.message}
          </Text>
        ) : null}
        <Text style={styles.helpText}>
          Create a token at github.com → Settings → Developer settings. It needs the{' '}
          <Text style={styles.code}>repo</Text> scope. For PRs in SSO-protected orgs (like{' '}
          <Text style={styles.code}>expo</Text>), open the token's “Configure SSO” menu and
          authorize it for the org — otherwise those PRs silently won't appear.
        </Text>
        <Text style={styles.helpText}>
          The token is stored as a plain file in this app's sandboxed container on your Mac.
        </Text>
        {token ? (
          <Pressable onPress={() => setToken(null)} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear token</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.bgRaised,
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
  },
  toolbarTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    letterSpacing: -0.15,
    color: colors.text,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
    maxWidth: 560,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.neutral700,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 32,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 64,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.bg,
  },
  counterText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.neutral500,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.accent700,
  },
  successText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#2e7d32',
  },
  helpText: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.neutral600,
  },
  code: {
    fontFamily: 'Menlo',
    fontSize: 11,
    color: colors.text,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.accent700,
  },
});
