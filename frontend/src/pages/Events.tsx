import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/axios';
import { Event } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { EventModal } from '../components/events/EventModal';

export const Events = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const { user } = useAuth();

  const canManageEvents = user?.role && ['ADMIN', 'PRESIDENT', 'BOARD'].includes(user.role);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/events/');
      const events = response.data.results || response.data;
      const now = new Date();
      
      console.log('Current time:', now.toISOString());
      console.log('All events:', events);

      // Helper function to normalize date comparison
      const isEventPast = (event: Event) => {
        const startDate = new Date(event.start_date);
        const endDate = event.end_date ? new Date(event.end_date) : startDate;
        return endDate < now;
      };

      // Filter and categorize events
      const [past, upcoming] = events.reduce(
        (acc: [Event[], Event[]], event: Event) => {
          // For non-board members, skip inactive events
          if (!canManageEvents && !event.is_active) {
            return acc;
          }

          if (isEventPast(event)) {
            acc[0].push(event); // past events
          } else {
            acc[1].push(event); // upcoming events
          }
          return acc;
        },
        [[], []]
      );

      // Sort past events by start date descending (most recent first)
      const sortedPast = past.sort((a: Event, b: Event) => 
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );

      // Sort upcoming events by start date ascending (nearest first)
      const sortedUpcoming = upcoming.sort((a: Event, b: Event) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );

      setUpcomingEvents(sortedUpcoming);
      setPastEvents(sortedPast);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEventStatus = async (event: Event) => {
    try {
      await axios.patch(`/api/events/${event.id}/`, {
        is_active: !event.is_active
      });
      fetchEvents();
    } catch (err: any) {
      console.error('Error toggling event status:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = () => {
    setSelectedEvent(undefined);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await axios.delete(`/api/events/${eventId}/`);
      await fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20">
        <div className="container-padded">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container-padded">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-3xl font-bold">Events</h1>
            {canManageEvents && (
              <button
                onClick={handleCreateEvent}
                className="text-sm font-medium text-black hover:text-gray-600 transition-colors"
              >
                Create Event +
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-12">Upcoming Events</h2>
            <div className="space-y-8">
              {upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="group cursor-pointer"
                >
                  {event.cover_image && (
                    <div className="aspect-[2/1] overflow-hidden rounded-lg mb-4">
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-medium mb-2">{event.title}</h3>
                      <div className="text-sm text-gray-600">
                        <div>{formatDate(event.start_date)}</div>
                        <div>{event.venue}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
                        {event.category}
                      </span>
                      {canManageEvents && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleEventStatus(event)}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              event.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {event.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="px-3 py-1 rounded text-sm font-medium bg-indigo-100 text-indigo-800"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {upcomingEvents.length === 0 && (
                <p className="text-gray-500 text-center">No upcoming events</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-12">Past Events</h2>
            <div className="space-y-8">
              {pastEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="group cursor-pointer"
                >
                  {event.cover_image && (
                    <div className="aspect-[2/1] overflow-hidden rounded-lg mb-4">
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-medium mb-2">{event.title}</h3>
                      <div className="text-sm text-gray-600">
                        <div>{formatDate(event.start_date)}</div>
                        <div>{event.venue}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
                        {event.category}
                      </span>
                      {canManageEvents && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleEventStatus(event)}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              event.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {event.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="px-3 py-1 rounded text-sm font-medium bg-indigo-100 text-indigo-800"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {pastEvents.length === 0 && (
                <p className="text-gray-500 text-center">No past events</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEvents}
      />
    </div>
  );
}; 