import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Event } from '../types';
import { TeamSection } from '../components/TeamSection';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Alert } from '../components/common/Alert';
import { colors } from '../styles/tokens';
import axios from '../utils/axios';

export const Home = () => {
  const [dautars, setDautars] = useState<{ id: number; x: number }[]>([]);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('/api/events/');
        const events = response.data.results || response.data;
        const now = new Date();
        const upcoming = events
          .filter((event: Event) => {
            const endDate = event.end_date ? new Date(event.end_date) : new Date(event.start_date);
            return endDate >= now && event.is_active;
          })
          .sort((a: Event, b: Event) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        setUpcomingEvents(upcoming.slice(0, 3)); // Show only first 3 upcoming events
      } catch (err: any) {
        console.error('Error fetching events:', err);
        setEventsError(err.response?.data?.detail || 'Failed to load events');
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, []);

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

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName !== 'BUTTON' && 
        (e.target as HTMLElement).tagName !== 'A' && 
        (e.target as HTMLElement).tagName !== 'INPUT') {
      const x = e.clientX;
      const newDautar = { id: Date.now(), x };
      setDautars(prev => [...prev, newDautar]);
      setTimeout(() => {
        setDautars(prev => prev.filter(d => d.id !== newDautar.id));
      }, 2000);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeError('');
    setIsSubmitting(true);

    try {
      console.log('Attempting to subscribe with data:', { email, firstName, lastName });
      const response = await axios.post('/api/subscribers/', {
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim()
      });
      console.log('Subscription response:', response);
      setSubscribeSuccess(true);
      setEmail('');
      setFirstName('');
      setLastName('');
    } catch (err: any) {
      console.error('Subscription error:', err);
      console.error('Error response:', err.response);
      
      if (err.response?.data?.email) {
        setSubscribeError(err.response.data.email[0]);
      } else if (err.response?.data?.detail) {
        setSubscribeError(err.response.data.detail);
      } else if (err.response?.status === 404) {
        setSubscribeError('The subscription service is currently unavailable.');
      } else if (err.response?.status === 400) {
        const errors = err.response.data;
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError)) {
          setSubscribeError(firstError[0]);
        } else {
          setSubscribeError('Please check your information and try again.');
        }
      } else if (!err.response) {
        setSubscribeError('Network error. Please check your connection and try again.');
      } else {
        setSubscribeError('Failed to subscribe. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative" onClick={handleBackgroundClick}>
      <AnimatePresence>
        {dautars.map(dautar => (
          <motion.img
            key={dautar.id}
            src="/dutar.png"
            alt="Falling Dautar"
            className="fixed w-16 h-auto z-50 pointer-events-none"
            initial={{ top: -100, x: dautar.x - 32, rotate: 0, opacity: 1 }}
            animate={{ 
              top: window.innerHeight + 100,
              rotate: 360,
              opacity: 0
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 2,
              ease: [0.2, 0.8, 0.8, 1]
            }}
          />
        ))}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative h-[95vh] overflow-hidden">
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: 'url("/registan.jpg")',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-black/15" />
        <div className="container-padded relative z-10 h-full flex items-center justify-center pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative inline-block"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="bg-black/25 py-12 w-screen"
              >
                <div className="flex flex-col items-center gap-12 max-w-6xl mx-auto">
                  <div className="flex items-center gap-8">
                    <img 
                      src="/logo1.png" 
                      alt="Asian Crossroads Logo" 
                      className="w-40 h-40 drop-shadow-2xl"
                    />
                    <div className="text-left">
                      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-2xl">
                        Asian
                        <br />
                        Crossroads
                      </h1>
                      <div className="mt-4 text-2xl text-white tracking-widest font-medium">
                        at Yale
                      </div>
                    </div>
                  </div>
                  <div className="w-full max-w-2xl flex flex-col items-center gap-8">
                    <Button
                      onClick={() => {
                        document.getElementById('mailing-list')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Join Mailing List
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container-padded">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">About Us</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Asian Crossroads brings together students passionate about Central Asian culture, 
              history, and contemporary issues. Through our events and initiatives, we create 
              spaces for meaningful cultural exchange and learning.
            </p>
          </div>
        </div>
      </section>

      {/* Full Width Image Section */}
      <section className="relative h-[30vh] overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="w-full h-full"
        >
          <img 
            src="/cattle.PNG" 
            alt="Desert Landscape" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </motion.div>
      </section>

      {/* Events Section */}
      <section className="py-20">
        <div className="container-padded">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold">Upcoming Events</h2>
              <Link 
                to="/events"
                className="text-sm font-medium text-black hover:text-gray-600 transition-colors"
              >
                View all events →
              </Link>
            </div>
            {eventsError ? (
              <div className="text-center text-red-600 py-8">
                {eventsError}
              </div>
            ) : eventsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No upcoming events at the moment
              </div>
            ) : (
              <div className="space-y-6">
                {upcomingEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-6 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
                  >
                    {event.cover_image && (
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-medium">{event.title}</h3>
                        <div className="mt-2 space-y-1 text-sm text-gray-500">
                          <div className="flex items-center">
                            <span>{formatDate(event.start_date)}</span>
                            {event.end_date && (
                              <>
                                <span className="mx-2">-</span>
                                <span>{formatDate(event.end_date)}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center">
                            <span>{event.venue}</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
                        {event.category}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-padded">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold">Photo Gallery</h2>
              <button 
                className="text-sm font-medium text-black hover:text-gray-600 transition-colors"
                onClick={() => {/* Add view all functionality */}}
              >
                View all photos →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group aspect-w-4 aspect-h-3 relative overflow-hidden rounded-lg bg-gray-100"
              >
                <img 
                  src="/dune.jpg" 
                  alt="Desert Landscape at Sunset"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium">Desert Landscape at Sunset</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group aspect-w-4 aspect-h-3 relative overflow-hidden rounded-lg bg-gray-100"
              >
                <img 
                  src="/dune.jpg" 
                  alt="Desert Landscape in Sepia"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 sepia brightness-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium">Desert Landscape in Sepia</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group aspect-w-4 aspect-h-3 relative overflow-hidden rounded-lg bg-gray-100"
              >
                <img 
                  src="/dune.jpg" 
                  alt="Desert Landscape in Cool Tones"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 hue-rotate-30 contrast-125"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-sm font-medium">Desert Landscape in Cool Tones</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles Preview Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-padded">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold">Latest Articles</h2>
              <Link 
                to="/articles"
                className="text-sm font-medium text-black hover:text-gray-600 transition-colors"
              >
                Read all articles →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 bg-white rounded-lg shadow-sm"
              >
                <span className="text-sm text-gray-500">Culture</span>
                <h3 className="mt-2 text-xl font-medium">The Silk Road Legacy</h3>
                <p className="mt-2 text-gray-600">Exploring the ancient trade routes that connected East and West...</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 bg-white rounded-lg shadow-sm"
              >
                <span className="text-sm text-gray-500">History</span>
                <h3 className="mt-2 text-xl font-medium">Central Asian Architecture</h3>
                <p className="mt-2 text-gray-600">The stunning architectural marvels of the region...</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <TeamSection />

      {/* Mailing List Section */}
      <section id="mailing-list" className="py-24 bg-[#004aab] text-white">
        <div className="container-padded">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-white mb-4"
            >
              Stay Connected
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-white/90 mb-12"
            >
              Join our mailing list to receive updates about events and activities
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSubscribe}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  variant="white"
                />
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  variant="white"
                />
              </div>
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                variant="white"
              />
              
              {subscribeError && (
                <Alert variant="white">
                  {subscribeError}
                </Alert>
              )}

              {subscribeSuccess && (
                <Alert variant="white">
                  Thank you for subscribing!
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                variant="white"
                isLoading={isSubmitting}
              >
                Subscribe
              </Button>
            </motion.form>
          </div>
        </div>
      </section>
    </div>
  );
}; 