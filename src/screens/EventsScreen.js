import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Event } from "../entities/Event";
import { User } from "../entities/User";
import EventCard from "../components/Events/EventCard";
import EventForm from "../components/Events/EventForm";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import eventNotificationService from "../services/eventNotificationService";
import eventCleanupService from "../services/eventCleanupService";

export default function EventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filter, setFilter] = useState("all"); // all, upcoming, pending, past

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser?.uid) {
      // Archive past events and cleanup old archived events on mount
      eventCleanupService.runAutomaticCleanup().catch(err => {
        console.error('Event cleanup error:', err);
      });

      const unsubscribe = Event.onSnapshot(
        (eventsList) => {
          setEvents(eventsList);
        },
        { is_archived: { '$ne': true } }
      );

      return () => unsubscribe();
    }
  }, [currentUser?.uid]);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadCurrentUser();
      
      // Archive past events and cleanup old archived events
      await eventCleanupService.runAutomaticCleanup();
      
      const allEvents = await Event.filter({ is_archived: { '$ne': true } });
      setEvents(allEvents);
    } catch (error) {
      console.error("Error refreshing events:", error);
      Alert.alert("Error", "Failed to refresh events");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleCreateEvent = async (eventData) => {
    try {
      // Convert Date object to ISO string for storage
      const eventToCreate = {
        ...eventData,
        event_date: eventData.event_date ? eventData.event_date.toISOString().split('T')[0] : null,
      };

      const newEvent = await Event.create(eventToCreate);
      
      // Schedule notification if it's an invitation
      if (newEvent.event_type === 'invitation') {
        await eventNotificationService.scheduleEventNotification(newEvent);
      }

      setShowAddModal(false);
      Alert.alert("Success", "Event created successfully");
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", "Failed to create event: " + error.message);
    }
  };

  const handleUpdateEvent = async (eventData) => {
    try {
      const eventToUpdate = {
        ...eventData,
        event_date: eventData.event_date ? eventData.event_date.toISOString().split('T')[0] : null,
      };

      await Event.update(editingEvent.id, eventToUpdate);
      setShowAddModal(false);
      setEditingEvent(null);
      Alert.alert("Success", "Event updated successfully");
    } catch (error) {
      console.error("Error updating event:", error);
      Alert.alert("Error", "Failed to update event: " + error.message);
    }
  };

  const handleRespondToEvent = async (event, response) => {
    try {
      await Event.respondToEvent(event.id, response);
      
      // Cancel notification if event was responded to
      if (event.event_type === 'invitation') {
        await eventNotificationService.cancelEventNotification(event.id);
      }

      Alert.alert("Success", `Event ${response} successfully`);
    } catch (error) {
      console.error("Error responding to event:", error);
      Alert.alert("Error", "Failed to respond to event: " + error.message);
    }
  };

  const handleDeleteEvent = (event) => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Event.delete(event.id);
              await eventNotificationService.cancelEventNotification(event.id);
              
              // Close modal and navigate back to events list
              setShowAddModal(false);
              setEditingEvent(null);
              
              // Navigate to Events screen (in case we're not already there)
              navigation.navigate("Events");
              
              Alert.alert("Success", "Event deleted successfully");
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Error", "Failed to delete event");
            }
          },
        },
      ]
    );
  };

  const getFilteredEvents = () => {
    const now = new Date();
    
    switch (filter) {
      case "upcoming":
        return events.filter(event => {
          if (!event.event_date) return false;
          const eventDate = typeof event.event_date === 'string' 
            ? parseISO(event.event_date) 
            : new Date(event.event_date);
          return eventDate >= now;
        });
      case "pending":
        return events.filter(event => 
          event.status === 'pending' && event.created_by !== currentUser?.uid
        );
      case "past":
        return events.filter(event => {
          if (!event.event_date) return false;
          const eventDate = typeof event.event_date === 'string' 
            ? parseISO(event.event_date) 
            : new Date(event.event_date);
          return eventDate < now;
        });
      default:
        return events;
    }
  };

  const getGroupedEvents = () => {
    const filtered = getFilteredEvents();
    const grouped = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      past: [],
    };

    const now = new Date();
    
    filtered.forEach(event => {
      if (!event.event_date) {
        grouped.later.push(event);
        return;
      }

      const eventDate = typeof event.event_date === 'string' 
        ? parseISO(event.event_date) 
        : new Date(event.event_date);

      if (isPast(eventDate) && !isToday(eventDate)) {
        grouped.past.push(event);
      } else if (isToday(eventDate)) {
        grouped.today.push(event);
      } else if (isTomorrow(eventDate)) {
        grouped.tomorrow.push(event);
      } else {
        const daysDiff = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 7) {
          grouped.thisWeek.push(event);
        } else {
          grouped.later.push(event);
        }
      }
    });

    return grouped;
  };

  const groupedEvents = getGroupedEvents();
  const pendingCount = events.filter(e => 
    e.status === 'pending' && e.created_by !== currentUser?.uid && e.event_type === 'invitation'
  ).length;

  return (
    <View style={styles.container}>
      {/* Header with Filter and Add Button */}
      <View style={styles.header}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => setFilter("all")}
            style={styles.filterButtonWrapper}
          >
            {filter === "all" ? (
              <LinearGradient
                colors={["#14B8A6", "#06B6D4", "#3B82F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.filterButton, styles.filterButtonActive]}
              >
                <Text style={styles.filterTextActive}>All</Text>
              </LinearGradient>
            ) : (
              <View style={styles.filterButton}>
                <Text style={styles.filterText}>All</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("upcoming")}
            style={styles.filterButtonWrapper}
          >
            {filter === "upcoming" ? (
              <LinearGradient
                colors={["#14B8A6", "#06B6D4", "#3B82F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.filterButton, styles.filterButtonActive]}
              >
                <Text style={styles.filterTextActive}>Upcoming</Text>
              </LinearGradient>
            ) : (
              <View style={styles.filterButton}>
                <Text style={styles.filterText}>Upcoming</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("pending")}
            style={styles.filterButtonWrapper}
          >
            {filter === "pending" ? (
              <LinearGradient
                colors={["#14B8A6", "#06B6D4", "#3B82F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.filterButton, styles.filterButtonActive]}
              >
                <View style={styles.filterButtonWithBadge}>
                  <Text style={styles.filterTextActive}>Pending</Text>
                  {pendingCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{pendingCount}</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.filterButton}>
                <View style={styles.filterButtonWithBadge}>
                  <Text style={styles.filterText}>Pending</Text>
                  {pendingCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{pendingCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => {
            setEditingEvent(null);
            setShowAddModal(true);
          }}
          style={styles.addButtonContainer}
        >
          <LinearGradient
            colors={["#14B8A6", "#06B6D4", "#3B82F6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButton}
          >
            <Icon name="add" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {groupedEvents.today.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today</Text>
            {groupedEvents.today.map(event => (
              <EventCard
                key={event.id}
                event={event}
                currentUserId={currentUser?.uid}
                onPress={() => {
                  setEditingEvent(event);
                  setShowAddModal(true);
                }}
                onRespond={(response) => handleRespondToEvent(event, response)}
              />
            ))}
          </View>
        )}

        {groupedEvents.tomorrow.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tomorrow</Text>
            {groupedEvents.tomorrow.map(event => (
              <EventCard
                key={event.id}
                event={event}
                currentUserId={currentUser?.uid}
                onPress={() => {
                  setEditingEvent(event);
                  setShowAddModal(true);
                }}
                onRespond={(response) => handleRespondToEvent(event, response)}
              />
            ))}
          </View>
        )}

        {groupedEvents.thisWeek.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week</Text>
            {groupedEvents.thisWeek.map(event => (
              <EventCard
                key={event.id}
                event={event}
                currentUserId={currentUser?.uid}
                onPress={() => {
                  setEditingEvent(event);
                  setShowAddModal(true);
                }}
                onRespond={(response) => handleRespondToEvent(event, response)}
              />
            ))}
          </View>
        )}

        {groupedEvents.later.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Later</Text>
            {groupedEvents.later.map(event => (
              <EventCard
                key={event.id}
                event={event}
                currentUserId={currentUser?.uid}
                onPress={() => {
                  setEditingEvent(event);
                  setShowAddModal(true);
                }}
                onRespond={(response) => handleRespondToEvent(event, response)}
              />
            ))}
          </View>
        )}

        {filter === "all" && groupedEvents.past.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past</Text>
            {groupedEvents.past.map(event => (
              <EventCard
                key={event.id}
                event={event}
                currentUserId={currentUser?.uid}
                onPress={() => {
                  setEditingEvent(event);
                  setShowAddModal(true);
                }}
                onRespond={(response) => handleRespondToEvent(event, response)}
              />
            ))}
          </View>
        )}

        {getFilteredEvents().length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="event-busy" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>
              {filter === "pending" 
                ? "No pending invitations" 
                : "Create your first event to get started"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddModal(false);
          setEditingEvent(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setEditingEvent(null);
              }}
            >
              <Icon name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            {editingEvent && (
              <TouchableOpacity
                onPress={() => handleDeleteEvent(editingEvent)}
                style={styles.deleteButton}
              >
                <Icon name="delete" size={24} color="#DC2626" />
              </TouchableOpacity>
            )}
          </View>
          <EventForm
            event={editingEvent}
            onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
            onCancel={() => {
              setShowAddModal(false);
              setEditingEvent(null);
            }}
            title={editingEvent ? "Edit Event" : "Create New Event"}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  filterButtonWrapper: {
    borderRadius: 20,
    overflow: "hidden",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterButtonActive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  badge: {
    backgroundColor: "#F59E0B",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  addButtonContainer: {
    marginLeft: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  deleteButton: {
    padding: 4,
  },
});

