import { StyleSheet } from 'react-native';
import { responsiveSpacing, responsiveFontSize, getGridColumns } from '@/app/utils/responsive';

export const createResponsiveStyles = (theme: any) => StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: responsiveSpacing(12),
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Card styles
  card: {
    marginBottom: responsiveSpacing(12),
    borderRadius: responsiveSpacing(12),
  },
  cardContent: {
    padding: responsiveSpacing(12),
  },
  
  // Header styles
  headerSection: {
    padding: responsiveSpacing(12),
    alignItems: 'center',
  },
  headerInfo: {
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    fontWeight: '600',
    marginBottom: responsiveSpacing(4),
    fontSize: responsiveFontSize(18),
    textAlign: 'center',
  },
  headerSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: responsiveSpacing(8),
    fontSize: responsiveFontSize(14),
  },
  
  // Status badge
  statusBadge: {
    paddingHorizontal: responsiveSpacing(10),
    paddingVertical: responsiveSpacing(3),
    borderRadius: responsiveSpacing(10),
    marginBottom: responsiveSpacing(12),
  },
  statusText: {
    color: '#fff',
    fontSize: responsiveFontSize(11),
    fontWeight: '600',
  },
  
  // Action buttons
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: responsiveSpacing(8),
    marginTop: responsiveSpacing(12),
    width: '100%',
  },
  actionButton: {
    flex: 1,
    height: responsiveSpacing(40),
  },
  actionButtonSmall: {
    height: responsiveSpacing(36),
  },
  
  // Grid layouts
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -responsiveSpacing(8),
  },
  gridItem: {
    width: `${100 / getGridColumns()}%`,
    padding: responsiveSpacing(8),
  },
  
  // Stats and info items
  statItem: {
    alignItems: 'center',
    padding: responsiveSpacing(8),
  },
  statValue: {
    fontWeight: '600',
    marginVertical: responsiveSpacing(4),
    fontSize: responsiveFontSize(14),
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontSize: responsiveFontSize(12),
  },
  
  // Dividers
  divider: {
    marginVertical: responsiveSpacing(12),
  },
  
  // Modal styles
  modalContent: {
    backgroundColor: theme.colors.surface,
    margin: responsiveSpacing(16),
    borderRadius: responsiveSpacing(8),
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsiveSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  
  // Form styles
  formContainer: {
    padding: responsiveSpacing(16),
  },
  formField: {
    marginBottom: responsiveSpacing(16),
  },
  
  // Table styles
  tableContainer: {
    marginTop: responsiveSpacing(8),
  },
  tableHeader: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  tableHeaderText: {
    fontWeight: '600',
    fontSize: responsiveFontSize(12),
  },
  tableCell: {
    padding: responsiveSpacing(8),
  },
  tableCellText: {
    fontSize: responsiveFontSize(12),
  },
  
  // Action buttons in tables/lists
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: responsiveSpacing(4),
  },
  
  // Error and warning styles
  errorText: {
    color: theme.colors.error,
    marginBottom: responsiveSpacing(16),
    textAlign: 'center',
  },
  warningText: {
    color: theme.colors.error,
    marginBottom: responsiveSpacing(16),
  },
  
  // Button containers
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: responsiveSpacing(8),
    marginTop: responsiveSpacing(16),
  },
  
  // Delete confirmation
  deleteConfirmContent: {
    padding: responsiveSpacing(16),
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: responsiveSpacing(8),
    marginTop: responsiveSpacing(24),
  },
  cancelButton: {
    minWidth: responsiveSpacing(100),
  },
  confirmDeleteButton: {
    minWidth: responsiveSpacing(100),
  },
});

export default createResponsiveStyles; 