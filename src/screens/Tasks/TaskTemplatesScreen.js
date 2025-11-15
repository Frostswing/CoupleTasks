import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { TaskTemplate } from "../../entities/TaskTemplate";
import { User } from "../../entities/User";
import TaskTemplateCard from "../../components/Tasks/TaskTemplateCard";
import TaskTemplateForm from "../../components/Tasks/TaskTemplateForm";
import { handleError, showSuccess } from "../../services/errorHandlingService";
import taskGenerationService from "../../services/taskGenerationService";

export default function TaskTemplatesScreen({ navigation, route }) {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive', 'auto'

  // Handle navigation params to open template for editing
  useEffect(() => {
    if (route?.params?.editTemplateId && templates.length > 0) {
      const templateToEdit = templates.find(t => t.id === route.params.editTemplateId);
      if (templateToEdit) {
        setEditingTemplate(templateToEdit);
        setShowFormModal(true);
        // Clear the param to avoid reopening on re-render
        navigation.setParams({ editTemplateId: undefined });
      }
    }
  }, [route?.params?.editTemplateId, templates]);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        handleError(error, 'loadUser');
      }
    };
    loadUser();
  }, []);

  // Set up real-time template listener
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let isMounted = true;

    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 10000);

    const unsubscribe = TaskTemplate.onSnapshot(
      (templateList) => {
        if (!isMounted) return;
        
        clearTimeout(loadingTimeout);
        setTemplates(templateList);
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Apply filters
  useEffect(() => {
    let filtered = [...templates];

    switch (filter) {
      case 'active':
        filtered = filtered.filter(t => t.is_active);
        break;
      case 'inactive':
        filtered = filtered.filter(t => !t.is_active);
        break;
      case 'auto':
        filtered = filtered.filter(t => t.auto_generate);
        break;
      default:
        // 'all' - no filter
        break;
    }

    // Sort by name
    filtered.sort((a, b) => 
      a.template_name.localeCompare(b.template_name)
    );

    setFilteredTemplates(filtered);
  }, [templates, filter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const allTemplates = await TaskTemplate.getAll();
      setTemplates(allTemplates);
    } catch (error) {
      handleError(error, 'refreshTemplates');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowFormModal(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowFormModal(true);
  };

  const handleDeleteTemplate = (template) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.template_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TaskTemplate.delete(template.id);
              showSuccess('Template deleted successfully');
            } catch (error) {
              handleError(error, 'deleteTemplate');
            }
          }
        }
      ]
    );
  };

  const handleToggleActive = async (template) => {
    try {
      const newActiveState = !template.is_active;
      await TaskTemplate.update(template.id, {
        is_active: newActiveState
      });
      showSuccess(
        `Template ${newActiveState ? 'activated' : 'deactivated'}`
      );
      
      // If template was activated and has auto_generate, generate tasks for upcoming month (background)
      if (newActiveState && template.auto_generate) {
        taskGenerationService.generateTasksForUpcomingMonth().catch(error => {
          console.error('Error generating tasks after template activation:', error);
        });
      }
    } catch (error) {
      handleError(error, 'toggleTemplateActive');
    }
  };

  const handleSubmitTemplate = async (templateData) => {
    try {
      if (editingTemplate) {
        await TaskTemplate.update(editingTemplate.id, templateData);
        showSuccess('Template updated successfully');
        
        // If template is active and has auto_generate, generate tasks (background)
        if (templateData.is_active && templateData.auto_generate) {
          taskGenerationService.generateTasksForUpcomingMonth().catch(error => {
            console.error('Error generating tasks after template update:', error);
          });
        }
      } else {
        await TaskTemplate.create(templateData);
        showSuccess('Template created successfully');
        
        // If new template is active and has auto_generate, generate tasks (background)
        if (templateData.is_active && templateData.auto_generate) {
          taskGenerationService.generateTasksForUpcomingMonth().catch(error => {
            console.error('Error generating tasks after template creation:', error);
          });
        }
      }
      setShowFormModal(false);
      setEditingTemplate(null);
    } catch (error) {
      handleError(error, 'saveTemplate');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Task Templates</Text>
          <Text style={styles.subtitle}>
            {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateTemplate}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'inactive', label: 'Inactive' },
          { key: 'auto', label: 'Auto' },
        ].map((filterOption) => (
          <TouchableOpacity
            key={filterOption.key}
            style={[
              styles.filterButton,
              filter === filterOption.key && styles.filterButtonActive
            ]}
            onPress={() => setFilter(filterOption.key)}
          >
            <Text style={[
              styles.filterText,
              filter === filterOption.key && styles.filterTextActive
            ]}>
              {filterOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Templates List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#14B8A6"]}
            tintColor="#14B8A6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTemplates.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="description" size={48} color="#14B8A6" />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No templates yet' : `No ${filter} templates`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all'
                ? 'Create your first template to start auto-generating tasks'
                : `Try changing the filter to see more templates`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleCreateTemplate}
              >
                <Icon name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Create Template</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.templatesList}>
            {filteredTemplates.map((template) => (
              <TaskTemplateCard
                key={template.id}
                template={template}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                onToggleActive={handleToggleActive}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Template Form Modal */}
      <Modal
        visible={showFormModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowFormModal(false);
          setEditingTemplate(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TaskTemplateForm
              template={editingTemplate}
              onSubmit={handleSubmitTemplate}
              onCancel={() => {
                setShowFormModal(false);
                setEditingTemplate(null);
              }}
              title={editingTemplate ? 'Edit Template' : 'Create Template'}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#E6FFFA',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#14B8A6',
  },
  scrollView: {
    flex: 1,
  },
  templatesList: {
    padding: 20,
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
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14B8A6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

