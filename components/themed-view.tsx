import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { Text, View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, children, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  const safeChildren = React.Children.map(children, (child, index) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return (
        <Text key={String(index)}>{child}</Text>
      );
    }
    return child;
  });

  return <View style={[{ backgroundColor }, style]} {...otherProps}>{safeChildren}</View>;
}