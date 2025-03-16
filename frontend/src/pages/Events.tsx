import React from 'react';
import { motion } from 'framer-motion';
import { upcomingEvents } from '../utils/data';

export const Events = () => (
  <div className="min-h-screen">
    <section className="pt-32 pb-20">
      <div className="container-padded">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-12">Upcoming Events</h1>
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

    {/* Past Events Section */}
    <section className="pb-20">
      <div className="container-padded">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Past Events</h2>
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
            >
              <h3 className="text-xl font-medium">Central Asian Film Festival</h3>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>March 15, 2024</span>
                <span className="mx-2">•</span>
                <span>Yale Film Center</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
            >
              <h3 className="text-xl font-medium">Traditional Music Workshop</h3>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>March 1, 2024</span>
                <span className="mx-2">•</span>
                <span>Woolsey Hall</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors"
            >
              <h3 className="text-xl font-medium">Silk Road Cuisine Night</h3>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>February 20, 2024</span>
                <span className="mx-2">•</span>
                <span>Berkeley College Dining Hall</span>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-full p-4 mt-8 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <span>Load More Events</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  </div>
); 