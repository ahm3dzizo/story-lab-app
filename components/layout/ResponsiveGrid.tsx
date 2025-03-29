import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns: number;
  spacing?: number;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  children, 
  columns = 1,
  spacing = 16 
}) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[styles.container, { gap: spacing }]}>
      {React.Children.map(childrenArray, (child, index) => (
        <View style={[styles.item, { flex: 1 / columns }]}>
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  item: {
    minWidth: 200,
  },
});

export default ResponsiveGrid; 