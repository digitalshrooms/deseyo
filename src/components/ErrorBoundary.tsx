import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="max-w-sm text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Něco se pokazilo</h1>
            <p className="text-sm text-gray-500 mb-6">
              Nastala neočekávaná chyba. Zkuste stránku znovu načíst.
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: '#198379' }}
            >
              Načíst znovu
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
