import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { upcomingEvents } from '../utils/data';
import { TeamSection } from '../components/TeamSection';
import axios from '../utils/axios';

export const Home = () => {
  const [dautars, setDautars] = useState<{ id: number; x: number }[]>([]);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

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
                className="bg-black/25 py-12 backdrop-blur-sm w-screen"
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
                    <button
                      onClick={() => {
                        document.getElementById('mailing-list')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-[#2563EB] text-white px-5 py-2 rounded-[3px] text-[15px] font-medium hover:bg-[#1d4ed8] transition-colors"
                    >
                      Join Mailing List
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-padded">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold">About Us</h2>
              <p className="mt-6 text-gray-600 leading-relaxed">
                Asian Crossroads brings together students passionate about Central Asian culture, 
                history, and contemporary issues. Through our events and initiatives, we create 
                spaces for meaningful cultural exchange and learning.
              </p>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <img 
                src="/nomad.jpg" 
                alt="Traditional Central Asian Carpet" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
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
                className="text-sm font-medium text-[#004aab] hover:text-[#003d8f] transition-colors"
              >
                View all events →
              </Link>
            </div>
            <div className="space-y-6">
              {upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-6 bg-white border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
                >
                  <h3 className="text-xl font-medium">{event.title}</h3>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>{event.date}</span>
                    <span className="mx-2">•</span>
                    <span>{event.location}</span>
                  </div>
                </motion.div>
              ))}
            </div>
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
      <section id="mailing-list" className="py-20 bg-[#004aab] text-white">
        <div className="container-padded">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold mb-4"
            >
              Stay Connected
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-white/90 mb-8"
            >
              Join our mailing list to receive updates about events and activities
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSubscribe}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
                />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
              />
              
              {subscribeError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm bg-white/10 text-white px-4 py-3 rounded-lg"
                >
                  {subscribeError}
                </motion.div>
              )}

              {subscribeSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm bg-white/10 text-white px-4 py-3 rounded-lg"
                >
                  Thank you for subscribing!
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full md:w-auto px-8 py-3 bg-white text-[#004aab] rounded-lg font-medium hover:bg-white/90 transition-all ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#004aab] mr-2"></div>
                    Subscribing...
                  </div>
                ) : (
                  'Subscribe'
                )}
              </button>
            </motion.form>
          </div>
        </div>
      </section>
    </div>
  );
}; 