

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { logger } from '../utils/logger';

class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    logger.error('ErrorBoundary caught:', error, errorInfo);

    // Increment error count to detect error loops
    this.setState(prev => ({
      errorCount: prev.errorCount + 1
    }));

    // If too many errors, try to recover by resetting
    if (this.state.errorCount > 2) {
      logger.warn('Too many errors, attempting recovery...');
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorCount: 0 });
  };

  render() {
    if (this.state.hasError) {
      const colors = this.props.colors;
      const isDeveloped = this.props.isDeveloped;

      return (
        <View style={[styles.container, { backgroundColor: colors?.background || '#fff' }]}>
          <Text style={[styles.title, { color: colors?.onSurface || '#000' }]}>
            Đã xảy ra lỗi
          </Text>
          <Text style={[styles.message, { color: colors?.onSurfaceVariant || '#666' }]}>
            {this.state.error?.message || 'Có lỗi không mong muốn. Vui lòng thử lại.'}
          </Text>

          {isDeveloped && (
            <View style={[styles.errorDetails, { backgroundColor: colors?.surfaceVariant }]}>
              <Text style={[styles.errorText, { color: colors?.onSurfaceVariant }]}>
                {this.state.error?.toString()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={this.handleReset}
            style={[styles.button, { backgroundColor: colors?.primary || '#002682' }]}
          >
            <Text style={[styles.buttonText, { color: colors?.onPrimary || '#fff' }]}>
              Thử lại
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary({ children, isDeveloped = false }) {
  const { colors } = useTheme();
  return (
    <ErrorBoundaryInner colors={colors} isDeveloped={isDeveloped}>
      {children}
    </ErrorBoundaryInner>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16
  },
  errorDetails: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 150,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  buttonText: {
    fontWeight: '700'
  },
});

