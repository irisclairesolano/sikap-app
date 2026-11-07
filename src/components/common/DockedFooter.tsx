import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';

export interface DockedFooterProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderTop?: boolean;
  backgroundColor?: string;
  horizontalPadding?: number;
}

/**
 * Standardized docked footer container for bottom CTAs and action bars.
 * Firmly grounds bottom buttons against the device bottom edge/navigation bar
 * with a crisp top border, safe-area inset protection, and compact vertical footprint.
 */
export const DockedFooter: React.FC<DockedFooterProps> = ({
  children,
  style,
  borderTop = true,
  backgroundColor = colors.paperBright,
  horizontalPadding = 20,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor, paddingHorizontal: horizontalPadding },
        borderTop && styles.borderTop,
        { paddingBottom: bottomInset },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingTop: 10,
    backgroundColor: colors.paperBright,
    width: '100%',
    borderRadius: 0,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
});

export default DockedFooter;
