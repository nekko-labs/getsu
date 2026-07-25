import { Component, type ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LIGHT } from './theme';

interface Props {
  children: ReactNode;
  surface?: string;
}

interface State {
  error: Error | null;
}

/**
 * Native counterpart of the web boundary: a render crash shows the paper card
 * with a way back instead of the red screen (dev) or a blank app (release).
 * Uses the light tokens directly — the store may be the thing that crashed.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[getsu] surface crashed', error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const t = LIGHT;
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 20, padding: 20, maxWidth: 420 }}>
          <Text style={{ fontFamily: 'Georgia', fontSize: 20, fontWeight: '600', color: t.error, marginBottom: 8 }}>
            {this.props.surface ? `${this.props.surface} hit a snag` : 'Something went wrong'}
          </Text>
          <Text style={{ color: t.textSoft, fontSize: 14, lineHeight: 21 }}>
            Your journal is saved on this device — nothing was lost.
          </Text>
          <Text style={{ color: t.textFaint, fontSize: 11, marginTop: 8 }}>{error.message}</Text>
          <Pressable
            onPress={() => this.setState({ error: null })}
            accessibilityRole="button"
            style={{ marginTop: 18, alignSelf: 'flex-start', backgroundColor: t.accent, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 }}
          >
            <Text style={{ color: t.onAccent, fontSize: 13, fontWeight: '600' }}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}
