import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Shown instead of the default paper card (e.g. a smaller inline fallback). */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Label used in the copy so a nested boundary can name its surface. */
  surface?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render/lifecycle crashes so a single broken surface can't take the
 * whole journal down with a blank page. The vault itself is already persisted,
 * so the honest message is "your writing is safe" plus a way back.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No telemetry in a local-first app: the console is the only reporter.
    console.error('[getsu] surface crashed', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="card max-w-md p-6" role="alert">
          <div className="mb-3 flex items-center gap-2" style={{ color: 'var(--error)' }}>
            <AlertTriangle size={18} />
            <h1 className="serif text-xl font-semibold">
              {this.props.surface ? `${this.props.surface} hit a snag` : 'Something went wrong'}
            </h1>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-soft)' }}>
            Your journal is saved on this device — nothing was lost. Try again, and if it keeps
            happening, reload the app.
          </p>
          <p className="mt-2 break-words font-mono text-[11px]" style={{ color: 'var(--text-faint)' }}>
            {error.message}
          </p>
          <div className="mt-5 flex gap-2">
            <button className="btn btn-primary" onClick={this.reset}>
              <RotateCcw size={14} /> Try again
            </button>
            <button className="btn" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
