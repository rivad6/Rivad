import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    // @ts-ignore
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6 font-mono text-white">
          <div className="max-w-md w-full bg-[#1a1a1a] border-2 border-brand-accent p-8 rounded-lg shadow-[0_0_30px_rgba(242,74,41,0.2)] relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>
            
            <div className="relative z-10 space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent animate-pulse">
                  <AlertCircle size={40} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tighter uppercase">System Error</h1>
                <p className="text-gray-400 text-sm">
                  Se ha producido un error inesperado en la simulación.
                </p>
              </div>

              <div className="bg-black/50 p-4 rounded text-left border border-white/10 overflow-auto max-h-32">
                <code className="text-xs text-brand-accent">
                  {this.state.error?.message || 'Unknown runtime error'}
                </code>
              </div>

              <button
                aria-label="Reiniciar Sistema"
                onClick={this.handleReset}
                className="w-full py-3 bg-brand-accent text-black font-bold uppercase tracking-widest hover:bg-white transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Reiniciar Sistema
              </button>
            </div>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
