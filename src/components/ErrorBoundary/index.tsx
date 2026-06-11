import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 自定义降级 UI，接收 error 和 reset 函数 */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** 组件名称，用于错误提示 */
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React 错误边界组件。
 * 捕获子组件树的渲染错误，展示友好提示并提供重试能力。
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      `[ErrorBoundary] ${this.props.componentName ?? 'Unknown'} crashed:`,
      error,
      errorInfo.componentStack,
    );
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, componentName } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.handleReset);
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          gap: '16px',
          color: 'var(--theme-textSecondary, #666)',
          textAlign: 'center',
          minHeight: '200px',
        }}>
          <div style={{ fontSize: '36px' }}>😵</div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--theme-text, #333)',
          }}>
            {componentName ? `「${componentName}」加载出错了` : '组件加载出错了'}
          </div>
          <div style={{
            fontSize: '12px',
            maxWidth: '360px',
            lineHeight: '1.5',
            color: 'var(--theme-textMuted, #999)',
            wordBreak: 'break-word',
          }}>
            {error.message}
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '6px 20px',
              fontSize: '12px',
              border: '1px solid var(--theme-border, #ddd)',
              borderRadius: 'var(--app-radius, 6px)',
              background: 'var(--theme-surface, #fff)',
              color: 'var(--theme-primary, #1677ff)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--theme-primary, #1677ff)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'var(--theme-primary, #1677ff)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--theme-surface, #fff)';
              e.currentTarget.style.color = 'var(--theme-primary, #1677ff)';
              e.currentTarget.style.borderColor = 'var(--theme-border, #ddd)';
            }}
          >
            重新加载
          </button>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
