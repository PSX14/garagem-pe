import React from 'react';
import { useWindowDimensions, View } from 'react-native';

/** Allow fields to keep their full text at larger Android font settings. */
export function useCompactOwnerLayout(): boolean {
  const { width, fontScale } = useWindowDimensions();
  return Math.min(width, 660) / Math.max(1, fontScale) < 320;
}

export function OwnerColumns({ children }: React.PropsWithChildren) {
  const compact = useCompactOwnerLayout();
  return <View style={{ flexDirection: compact ? 'column' : 'row', alignItems: 'stretch', gap: 10 }}>{React.Children.map(children, child => <View style={compact ? { width: '100%' } : { flex: 1 }}>{child}</View>)}</View>;
}
