import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import { TaskTableConfig } from '../entities/TaskTableConfig';
import excelImportService from '../services/excelImportService';
import taskTableSyncService from '../services/taskTableSyncService';
import i18n from '../localization/i18n';

export default function TaskTableScreen({ navigation }) {
  const [tableRows, setTableRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    task_name: '',
    current_performer: '',
    current_duration: '',
    current_frequency: '',
    planned_performer: '',
    planned_duration: '',
    planned_frequency: '',
    notes: '',
  });

  useEffect(() => {
    loadTableData();
  }, []);

  const loadTableData = async () => {
    setIsLoading(true);
    try {
      const configs = await TaskTableConfig.list();
      setTableRows(configs);
    } catch (error) {
      console.error('Error loading table data:', error);
      Alert.alert('Error', 'Failed to load table data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportExcel = async () => {
    try {
      setIsImporting(true);

      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', file);

      // Import the file
      const importResult = await excelImportService.importToDatabase(file.uri);

      if (importResult.success) {
        Alert.alert(
          'Success',
          `Imported ${importResult.count} tasks successfully!`,
          [{ text: 'OK', onPress: loadTableData }]
        );
      } else {
        Alert.alert('Error', importResult.error || 'Failed to import Excel file');
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      Alert.alert('Error', error.message || 'Failed to import Excel file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSyncToTasks = async () => {
    if (tableRows.length === 0) {
      Alert.alert(
        'No Data',
        'Please import an Excel file first or add tasks manually.'
      );
      return;
    }

    Alert.alert(
      'Sync to Tasks',
      'This will delete all previously generated tasks and create new ones based on the current table. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          style: 'destructive',
          onPress: performSync,
        },
      ]
    );
  };

  const performSync = async () => {
    setIsSyncing(true);
    try {
      const result = await taskTableSyncService.syncTableToTasks();

      if (result.success) {
        Alert.alert(
          'Success!',
          result.message,
          [{ text: 'OK', onPress: loadTableData }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to sync tasks');
      }
    } catch (error) {
      console.error('Error syncing tasks:', error);
      Alert.alert('Error', error.message || 'Failed to sync tasks');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddRow = () => {
    setFormData({
      category: '',
      subcategory: '',
      task_name: '',
      current_performer: '',
      current_duration: '',
      current_frequency: '',
      planned_performer: '',
      planned_duration: '',
      planned_frequency: '',
      notes: '',
    });
    setShowAddDialog(true);
  };

  const handleEditRow = (row) => {
    setEditingRow(row);
    setFormData({
      category: row.category,
      subcategory: row.subcategory,
      task_name: row.task_name,
      current_performer: row.current_performer,
      current_duration: row.current_duration,
      current_frequency: row.current_frequency,
      planned_performer: row.planned_performer,
      planned_duration: row.planned_duration,
      planned_frequency: row.planned_frequency,
      notes: row.notes || '',
    });
    setShowEditDialog(true);
  };

  const handleSaveRow = async () => {
    if (!formData.task_name.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    try {
      if (editingRow) {
        await TaskTableConfig.update(editingRow.id, formData);
        setShowEditDialog(false);
      } else {
        await TaskTableConfig.create(formData);
        setShowAddDialog(false);
      }
      loadTableData();
    } catch (error) {
      console.error('Error saving row:', error);
      Alert.alert('Error', 'Failed to save task');
    }
  };

  const handleDeleteRow = (row) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${row.task_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TaskTableConfig.delete(row.id);
              loadTableData();
            } catch (error) {
              console.error('Error deleting row:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const handleClearTable = () => {
    Alert.alert(
      'Clear Table',
      'Are you sure you want to clear all table data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await TaskTableConfig.deleteAll();
              loadTableData();
            } catch (error) {
              console.error('Error clearing table:', error);
              Alert.alert('Error', 'Failed to clear table');
            }
          },
        },
      ]
    );
  };

  const TaskRowCard = ({ row }) => (
    <View style={styles.rowCard}>
      <View style={styles.rowHeader}>
        <View style={styles.rowHeaderLeft}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(row.category) }]}>
            <Text style={styles.categoryBadgeText}>{row.category}</Text>
          </View>
          <Text style={styles.subcategoryText}>{row.subcategory}</Text>
        </View>
        <View style={styles.rowActions}>
          <TouchableOpacity onPress={() => handleEditRow(row)} style={styles.actionButton}>
            <Icon name="edit" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteRow(row)} style={styles.actionButton}>
            <Icon name="delete" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.taskNameText}>{row.task_name}</Text>
      
      <View style={styles.rowDetails}>
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Current</Text>
          {row.current_frequency && (
            <Text style={styles.detailText}>📅 {row.current_frequency}</Text>
          )}
          {row.current_duration && (
            <Text style={styles.detailText}>⏱️ {row.current_duration}</Text>
          )}
          {row.current_performer && (
            <Text style={styles.detailText}>👤 {row.current_performer}</Text>
          )}
        </View>
        
        <View style={styles.detailDivider} />
        
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Planned</Text>
          {row.planned_frequency && (
            <Text style={styles.detailText}>📅 {row.planned_frequency}</Text>
          )}
          {row.planned_duration && (
            <Text style={styles.detailText}>⏱️ {row.planned_duration}</Text>
          )}
          {row.planned_performer && (
            <Text style={styles.detailText}>👤 {row.planned_performer}</Text>
          )}
        </View>
      </View>

      {row.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>📝 Notes:</Text>
          <Text style={styles.notesText}>{row.notes}</Text>
        </View>
      )}

      {row.is_synced && (
        <View style={styles.syncedBadge}>
          <Icon name="check-circle" size={14} color="#16A34A" />
          <Text style={styles.syncedBadgeText}>Synced</Text>
        </View>
      )}
    </View>
  );

  const FormModal = ({ visible, onClose, title }) => (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <TextInput
              style={styles.input}
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
              placeholder="e.g., Cleaning, Laundry"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Subcategory</Text>
            <TextInput
              style={styles.input}
              value={formData.subcategory}
              onChangeText={(text) => setFormData({ ...formData, subcategory: text })}
              placeholder="e.g., Kitchen, Bathroom"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Task Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.task_name}
              onChangeText={(text) => setFormData({ ...formData, task_name: text })}
              placeholder="e.g., Clean floors"
            />
          </View>

          <Text style={styles.sectionTitle}>Current Situation</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Frequency</Text>
            <TextInput
              style={styles.input}
              value={formData.current_frequency}
              onChangeText={(text) => setFormData({ ...formData, current_frequency: text })}
              placeholder="e.g., Daily, Weekly, Every 3 days"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration</Text>
            <TextInput
              style={styles.input}
              value={formData.current_duration}
              onChangeText={(text) => setFormData({ ...formData, current_duration: text })}
              placeholder="e.g., 15 minutes, Half hour"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Performer</Text>
            <TextInput
              style={styles.input}
              value={formData.current_performer}
              onChangeText={(text) => setFormData({ ...formData, current_performer: text })}
              placeholder="e.g., Together, Person 1"
            />
          </View>

          <Text style={styles.sectionTitle}>Planned Changes</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Frequency</Text>
            <TextInput
              style={styles.input}
              value={formData.planned_frequency}
              onChangeText={(text) => setFormData({ ...formData, planned_frequency: text })}
              placeholder="e.g., Daily, Weekly, Every 3 days"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration</Text>
            <TextInput
              style={styles.input}
              value={formData.planned_duration}
              onChangeText={(text) => setFormData({ ...formData, planned_duration: text })}
              placeholder="e.g., 15 minutes, Half hour"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Performer</Text>
            <TextInput
              style={styles.input}
              value={formData.planned_performer}
              onChangeText={(text) => setFormData({ ...formData, planned_performer: text })}
              placeholder="e.g., Together, Person 1"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (הערות)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Additional notes or comments..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveRow}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text style={styles.loadingText}>Loading task table...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Task Table</Text>
          <Text style={styles.subtitle}>
            {tableRows.length} task{tableRows.length !== 1 ? 's' : ''} configured
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionBarButton, styles.importButton]}
          onPress={handleImportExcel}
          disabled={isImporting}
        >
          {isImporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="upload-file" size={20} color="#FFFFFF" />
              <Text style={styles.actionBarButtonText}>Import Excel</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBarButton, styles.syncButton]}
          onPress={handleSyncToTasks}
          disabled={isSyncing || tableRows.length === 0}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="sync" size={20} color="#FFFFFF" />
              <Text style={styles.actionBarButtonText}>Sync</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBarButton, styles.addButton]}
          onPress={handleAddRow}
        >
          <Icon name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Table Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {tableRows.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="table-chart" size={48} color="#14B8A6" />
            </View>
            <Text style={styles.emptyTitle}>No Tasks Yet</Text>
            <Text style={styles.emptySubtitle}>
              Import an Excel file or add tasks manually to get started
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleImportExcel}>
              <Icon name="upload-file" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Import Excel File</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tableContent}>
            {tableRows.map((row) => (
              <TaskRowCard key={row.id} row={row} />
            ))}
            
            {/* Clear Table Button */}
            <TouchableOpacity style={styles.clearButton} onPress={handleClearTable}>
              <Icon name="delete-sweep" size={20} color="#EF4444" />
              <Text style={styles.clearButtonText}>Clear All Data</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modals */}
      <FormModal
        visible={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        title="Add Task"
      />
      <FormModal
        visible={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        title="Edit Task"
      />
    </SafeAreaView>
  );
}

const getCategoryColor = (category) => {
  const colors = {
    'ניקיון': '#3B82F6',
    'כביסה': '#14B8A6',
    'תחזוקה שוטפת': '#F59E0B',
    'רכב': '#EF4444',
    'חיות מחמד': '#10B981',
    'תשלומים וכלכלה': '#6366F1',
    'אוכל': '#EC4899',
  };
  return colors[category] || '#6B7280';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  actionBarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  actionBarButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  importButton: {
    backgroundColor: '#3B82F6',
  },
  syncButton: {
    backgroundColor: '#16A34A',
  },
  addButton: {
    flex: 0,
    width: 48,
    backgroundColor: '#14B8A6',
  },
  scrollView: {
    flex: 1,
  },
  tableContent: {
    padding: 20,
    paddingBottom: 100,
  },
  rowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  subcategoryText: {
    fontSize: 12,
    color: '#6B7280',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  taskNameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  rowDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailSection: {
    flex: 1,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#14B8A6',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 3,
  },
  detailDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    gap: 4,
  },
  syncedBadgeText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#14B8A6',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  clearButtonText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#E6FFFA',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14B8A6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14B8A6',
    marginTop: 16,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#14B8A6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

