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
import { useTheme } from '../hooks/useTheme';
import { useToken } from '../hooks/useToken';
import {
  checkForUpdates,
  getCurrentVersion,
  installAndRelaunch,
  useUpdateStatus,
} from '../lib/updateStatus';
import { appBadgeColor } from '../theme';

export function SettingsScreen({ onDone }: { onDone?: () => void }) {
  const { colors } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.appBg }]}>
      <View
        style={[styles.toolbar, { backgroundColor: colors.titlebar, borderBottomColor: colors.border }]}
      >
        <Text style={[styles.toolbarTitle, { color: colors.text }]}>Settings</Text>
        {token && onDone ? (
          <Pressable
            onPress={onDone}
            style={[styles.secondaryButton, { backgroundColor: colors.sunken }]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Done</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }, colors.shadow]}>
          <Text style={[styles.label, { color: colors.muted }]}>GitHub Personal Access Token</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={token ? 'Token saved — paste to replace' : 'ghp_…'}
              placeholderTextColor={colors.faint}
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                { backgroundColor: colors.sunken, borderColor: colors.border, color: colors.text },
              ]}
              onSubmitEditing={save}
            />
            <Pressable
              onPress={save}
              disabled={saving}
              style={[styles.saveButton, { backgroundColor: appBadgeColor }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </Pressable>
          </View>
          <Text style={[styles.counterText, { color: colors.faint }]}>
            {input.length} characters entered
          </Text>
          {status ? (
            <Text
              style={[
                styles.statusText,
                { color: status.kind === 'error' ? colors.danger : colors.success },
              ]}
            >
              {status.message}
            </Text>
          ) : null}
          <Text style={[styles.helpText, { color: colors.muted }]}>
            Create a token at github.com → Settings → Developer settings. It needs the{' '}
            <Text style={styles.code}>repo</Text> scope. For PRs in SSO-protected orgs (like{' '}
            <Text style={styles.code}>expo</Text>), open the token's “Configure SSO” menu and
            authorize it for the org — otherwise those PRs silently won't appear.
          </Text>
          <Text style={[styles.helpText, { color: colors.muted }]}>
            The token is stored securely in your macOS Keychain.
          </Text>
          {token ? (
            <Pressable
              onPress={() => setToken(null)}
              style={[styles.clearButton, { backgroundColor: colors.sunken }]}
            >
              <Text style={[styles.clearButtonText, { color: colors.danger }]}>Clear token</Text>
            </Pressable>
          ) : null}
        </View>
        <UpdatesCard />
      </View>
    </View>
  );
}

function UpdatesCard() {
  const { colors } = useTheme();
  const update = useUpdateStatus();
  const { version, build } = getCurrentVersion();

  const statusLabel = {
    idle: null,
    checking: 'Checking for updates…',
    downloading: `Downloading update${update.version ? ` ${update.version}` : ''}…`,
    ready: `Update${update.version ? ` ${update.version}` : ''} is ready.`,
    installing: 'Installing update…',
    upToDate: 'The app is up to date.',
    error: update.message ?? 'The update check failed.',
  }[update.phase];
  const statusColor =
    update.phase === 'error'
      ? colors.danger
      : update.phase === 'ready' || update.phase === 'upToDate'
        ? colors.success
        : colors.muted;
  const busy =
    update.phase === 'checking' || update.phase === 'downloading' || update.phase === 'installing';

  return (
    <View style={[styles.card, styles.updatesCard, { backgroundColor: colors.card }, colors.shadow]}>
      <Text style={[styles.label, { color: colors.muted }]}>Updates</Text>
      <Text style={[styles.helpText, { color: colors.muted }]}>
        GitHub Tracker {version} (build {build})
      </Text>
      {statusLabel ? (
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      ) : null}
      <Pressable
        onPress={() => (update.phase === 'ready' ? installAndRelaunch() : checkForUpdates())}
        disabled={busy}
        style={[styles.clearButton, { backgroundColor: colors.sunken, opacity: busy ? 0.5 : 1 }]}
      >
        <Text style={[styles.clearButtonText, { color: colors.text }]}>
          {update.phase === 'ready' ? 'Restart to update' : 'Check for updates'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  toolbarTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.14,
  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 22,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
    maxWidth: 560,
  },
  updatesCard: {
    marginTop: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 64,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  counterText: {
    fontSize: 11,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    lineHeight: 17,
  },
  code: {
    fontFamily: 'Menlo',
    fontSize: 11,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
