import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const colors = this.props.colors;
      return (
        <View style={[styles.container, { backgroundColor: colors?.background || '#fff' }]}>
          <Text style={[styles.title, { color: colors?.onSurface || '#000' }]}>Đã xảy ra lỗi</Text>
          <Text style={[styles.message, { color: colors?.onSurfaceVariant || '#666' }]}>
            {this.state.error?.message || 'Có lỗi không mong muốn. Vui lòng thử lại.'}
          </Text>
          <TouchableOpacity onPress={this.handleReset} style={[styles.button, { backgroundColor: colors?.primary || '#002682' }]}>
            <Text style={[styles.buttonText, { color: colors?.onPrimary || '#fff' }]}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary({ children }) {
  const { colors } = useTheme();
  return <ErrorBoundaryInner colors={colors}>{children}</ErrorBoundaryInner>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  message: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  button: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  buttonText: { fontWeight: '700' },
});

