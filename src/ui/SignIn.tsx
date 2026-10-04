import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signIn, signUp, useSession } from '../auth/session';
import { Button, Card, Label, Txt } from './primitives';
import { Screen } from './Screen';
import { useTheme } from './theme';

/**
 * The sign-in gate.
 *
 * Progress belongs to an account, so it follows the learner to any device and
 * survives a cleared browser. One screen does both sign-in and account
 * creation — the only difference is which button you press — so nobody has to
 * work out which one they need before they start.
 */
export function SignIn() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const status = useSession((s) => s.status);
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    const error = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (error) setMessage(error);
  };

  const inputStyle = {
    marginTop: t.space(1.5),
    backgroundColor: t.c.surface,
    borderWidth: 1,
    borderColor: t.c.border,
    borderRadius: t.radius.md,
    paddingHorizontal: t.space(3.5),
    paddingVertical: t.space(3),
    color: t.c.text,
    fontSize: 16,
  };

  const ready = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  return (
    <Screen
      contentContainerStyle={{
        padding: t.space(4),
        paddingTop: insets.top + t.space(6),
        paddingBottom: insets.bottom + t.space(8),
        gap: t.space(4),
        maxWidth: 520,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      <View>
        <Txt variant="display">Skema</Txt>
        <Txt variant="body" color={t.c.textMuted} style={{ marginTop: t.space(2), lineHeight: 22 }}>
          {mode === 'signIn'
            ? 'Sign in to pick up where you left off, on any device.'
            : 'Create an account to keep your progress — it follows you to any device, and nothing is lost if you clear your browser.'}
        </Txt>
      </View>

      {status === 'unconfigured' ? (
        <Card tone="warning">
          <Label color={t.c.warning}>Accounts not set up</Label>
          <Txt variant="body" style={{ marginTop: t.space(2), lineHeight: 22 }}>
            This copy of the app has no account server configured, so you can’t sign in yet.
          </Txt>
        </Card>
      ) : (
        <>
          <View>
            <Label>Email</Label>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.dk"
              placeholderTextColor={t.c.textFaint}
              style={inputStyle}
            />
          </View>
          <View>
            <Label>Password</Label>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
              placeholder={mode === 'signUp' ? 'At least 6 characters' : ''}
              placeholderTextColor={t.c.textFaint}
              onSubmitEditing={ready ? submit : undefined}
              style={inputStyle}
            />
          </View>

          {message ? (
            <Card tone="warning">
              <Txt variant="body" style={{ lineHeight: 22 }}>
                {message}
              </Txt>
            </Card>
          ) : null}

          <Button
            label={mode === 'signIn' ? 'Sign in' : 'Create account'}
            loading={busy}
            disabled={!ready}
            onPress={submit}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setMessage(null);
            }}
            style={{ alignItems: 'center', paddingVertical: t.space(2) }}
          >
            <Txt variant="body" color={t.c.accent}>
              {mode === 'signIn' ? 'New here? Create an account' : 'Already have an account? Sign in'}
            </Txt>
          </Pressable>
        </>
      )}

      <Txt variant="label" color={t.c.textFaint}>
        Progress you made on this device before accounts existed moves into the first account that signs in
        here.
      </Txt>
    </Screen>
  );
}
