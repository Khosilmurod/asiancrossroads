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

      const upcoming = events
        .filter((event: Event) => {
          const endDate = event.end_date ? new Date(event.end_date) : new Date(event.start_date);
          return endDate >= now;
        })
        .sort((a: Event, b: Event) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      const past = events
        .filter((event: Event) => {
          const endDate = event.end_date ? new Date(event.end_date) : new Date(event.start_date);
          return endDate < now;
        })
        .sort((a: Event, b: Event) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

      setUpcomingEvents(upcoming);
      setPastEvents(past);
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
      fetchEvents(); // Refresh the events list
    } catch (err: any) {
      console.error('Error toggling event status:', err);
      // Show error message to user
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
      hour: 'numeric',
      minute: '2-digit',
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          {canManageEvents && (
            <button
              onClick={handleCreateEvent}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Event
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
                    {event.cover_image && (
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                      <p className="mt-2 text-gray-600 line-clamp-3">{event.description}</p>
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Date:</span>{' '}
                          {new Date(event.start_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Venue:</span> {event.venue}
                        </p>
                        {canManageEvents && (
                          <div className="mt-4 flex items-center justify-between">
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
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {upcomingEvents.length === 0 && (
                <p className="text-gray-500 text-center">No upcoming events</p>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Past Events</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pastEvents.map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
                    {event.cover_image && (
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                      <p className="mt-2 text-gray-600 line-clamp-3">{event.description}</p>
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Date:</span>{' '}
                          {new Date(event.start_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Venue:</span> {event.venue}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {pastEvents.length === 0 && (
                <p className="text-gray-500 text-center">No past events</p>
              )}
            </div>
          </>
        )}
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