import { database } from '../firebase/config';
import { 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove, 
  onValue
} from 'firebase/database';
import { getCurrentUser, getDataSource } from '../services/userService';

export class Event {
  constructor(data) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.description = data.description || '';
    this.notes = data.notes || '';
    this.event_date = data.event_date || null;
    this.event_time = data.event_time || '';
    this.duration = data.duration || null; // in minutes
    this.event_type = data.event_type || 'informational'; // informational, invitation, solo_ok
    this.status = data.status || 'pending'; // pending, acknowledged, accepted, declined, disputed
    this.category = data.category || 'social';
    this.location = data.location || '';
    this.created_by = data.created_by || '';
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = data.updated_date || new Date().toISOString();
    this.partner_response = data.partner_response || null; // { responded_by, responded_at, response }
    this.notification_sent = data.notification_sent || false;
    this.is_archived = data.is_archived || false;
    this.archived_date = data.archived_date || null;
  }

  static async create(eventData) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to create events');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const eventsRef = ref(database, `${dataSource.path}/events`);
      const newEventRef = push(eventsRef);

      const eventWithDefaults = {
        ...eventData,
        created_by: user.uid,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        status: eventData.status || (eventData.event_type === 'invitation' ? 'pending' : 'pending'),
        notification_sent: false,
        is_archived: false,
        partner_response: null
      };

      await set(newEventRef, eventWithDefaults);
      return new Event({ id: newEventRef.key, ...eventWithDefaults });
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to get events');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const eventRef = ref(database, `${dataSource.path}/events/${id}`);
      const snapshot = await get(eventRef);
      
      if (snapshot.exists()) {
        return new Event({ id: snapshot.key, ...snapshot.val() });
      }
      return null;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  }

  static async update(id, updates) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to update events');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const eventRef = ref(database, `${dataSource.path}/events/${id}`);
      
      await update(eventRef, {
        ...updates,
        updated_date: new Date().toISOString(),
        updated_by: user.uid
      });
      
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to delete events');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const eventRef = ref(database, `${dataSource.path}/events/${id}`);
      await remove(eventRef);
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  static async filter(filters = {}, orderField = 'event_date', orderDirection = 'desc') {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to filter events');
      }

      const dataSource = await getDataSource(user.uid);
      if (!dataSource.success) {
        throw new Error(dataSource.error);
      }

      const eventsRef = ref(database, `${dataSource.path}/events`);
      const snapshot = await get(eventsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const data = snapshot.val() || {};
      let events = Object.entries(data).map(([id, eventData]) => 
        new Event({ id, ...eventData })
      );

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'object' && value['$ne']) {
          events = events.filter(event => event[key] !== value['$ne']);
        } else if (value !== undefined && value !== null && value !== '') {
          events = events.filter(event => event[key] === value);
        }
      });

      // Apply sorting
      const sortField = orderField.startsWith('-') ? orderField.substring(1) : orderField;
      const sortDirection = orderField.startsWith('-') ? 'desc' : orderDirection;
      
      events.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        // Handle date sorting
        if (sortField === 'event_date') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
        }
        if (typeof bValue === 'string') {
          bValue = bValue.toLowerCase();
        }
        
        if (sortDirection === 'desc') {
          return bValue > aValue ? 1 : (bValue < aValue ? -1 : 0);
        } else {
          return aValue > bValue ? 1 : (aValue < bValue ? -1 : 0);
        }
      });

      return events;
    } catch (error) {
      console.error('Error filtering events:', error);
      throw error;
    }
  }

  static onSnapshot(callback, filters = {}) {
    try {
      const user = getCurrentUser();
      if (!user) {
        callback([]);
        return () => {};
      }

      let unsubscribe = () => {};

      getDataSource(user.uid).then((dataSource) => {
        if (!dataSource.success) {
          console.error('Error getting data source:', dataSource.error);
          callback([]);
          return;
        }

        const eventsRef = ref(database, `${dataSource.path}/events`);
        
        const unsubscribeFunc = onValue(
          eventsRef,
          (snapshot) => {
            const data = snapshot.val() || {};
            let events = Object.entries(data).map(([id, eventData]) => 
              new Event({ id, ...eventData })
            );

            // Apply filters
            Object.entries(filters).forEach(([key, value]) => {
              if (value && typeof value === 'object' && value['$ne']) {
                events = events.filter(event => event[key] !== value['$ne']);
              } else if (value !== undefined && value !== null && value !== '') {
                events = events.filter(event => event[key] === value);
              }
            });

            callback(events);
          },
          (error) => {
            console.error('Error in event listener:', error);
            callback([]);
          }
        );

        unsubscribe = unsubscribeFunc;
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up event listener:', error);
      return () => {};
    }
  }

  // Respond to an event (for partner)
  static async respondToEvent(eventId, response) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be logged in to respond to events');
      }

      const event = await this.getById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Don't allow creator to respond to their own event
      if (event.created_by === user.uid) {
        throw new Error('Cannot respond to your own event');
      }

      let status = 'acknowledged';
      if (response === 'accepted') {
        status = 'accepted';
      } else if (response === 'declined') {
        status = 'declined';
      } else if (response === 'disputed') {
        status = 'disputed';
      }

      await this.update(eventId, {
        status,
        partner_response: {
          responded_by: user.uid,
          responded_at: new Date().toISOString(),
          response
        }
      });

      return true;
    } catch (error) {
      console.error('Error responding to event:', error);
      throw error;
    }
  }
}

