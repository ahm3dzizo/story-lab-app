import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DataTable, Text } from 'react-native-paper';

interface Column {
  id: string;
  label: string;
  numeric?: boolean;
  render?: (value: any) => React.ReactNode;
}

interface ResponsiveDataTableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
  compact?: boolean;
}

export const ResponsiveDataTable: React.FC<ResponsiveDataTableProps> = ({
  columns,
  data,
  emptyMessage = 'No data available',
  compact = false,
}) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <DataTable>
      <DataTable.Header>
        {columns.map((column) => (
          <DataTable.Title
            key={column.id}
            numeric={column.numeric}
            style={[styles.cell, compact && styles.compactCell]}
          >
            {column.label}
          </DataTable.Title>
        ))}
      </DataTable.Header>

      {data.map((row, index) => (
        <DataTable.Row key={index}>
          {columns.map((column) => (
            <DataTable.Cell
              key={column.id}
              numeric={column.numeric}
              style={[styles.cell, compact && styles.compactCell]}
            >
              {column.render ? column.render(row[column.id]) : row[column.id]}
            </DataTable.Cell>
          ))}
        </DataTable.Row>
      ))}
    </DataTable>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  cell: {
    flex: 1,
    minWidth: 100,
  },
  compactCell: {
    minWidth: 80,
    paddingHorizontal: 8,
  },
});

export default ResponsiveDataTable; 