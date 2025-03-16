import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { DEFAULT_AVATAR } from '../constants/images';

interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  title: string;
  profile_picture: string;
  graduating_year: string;
  major: string;
  description: string;
  is_main: boolean;
}

export const Team = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      console.log('Fetching team members...');
      const response = await axios.get<TeamMember[]>('http://localhost:8000/auth/team/');
      console.log('Response:', response.data);

      // Filter out admin users and ensure we have an array
      const members = Array.isArray(response.data) ? response.data.filter(member => member.role !== 'ADMIN') : [];
      console.log('Processed members:', members);

      // Sort users: President first, then Board members
      const sortedMembers = [...members].sort((a, b) => {
        if (a.role === 'PRESIDENT') return -1;
        if (b.role === 'PRESIDENT') return 1;
        return 0;
      });

      setTeamMembers(sortedMembers);
    } catch (err: any) {
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        err.message || 
        'Failed to fetch team members'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004aab]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gray-50">
        <div className="container-padded">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold mb-6"
            >
              Meet Our Team
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-600 leading-relaxed"
            >
              Dedicated students bringing Central Asian culture to life at Yale University
            </motion.p>
          </div>
        </div>
      </section>

      {/* Team Grid Section */}
      <section className="py-20">
        <div className="container-padded">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-12">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center group w-full md:w-[calc(33.333%-16px)]"
                >
                  <div className="relative mb-6">
                    <div className="w-40 h-48 rounded-xl overflow-hidden mb-4 mx-auto">
                      <img 
                        src={member.profile_picture || DEFAULT_AVATAR}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#004aab] text-white px-4 py-1 rounded-full text-sm font-medium"
                    >
                      {member.title}
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{`${member.first_name} ${member.last_name}`}</h3>
                  <p className="text-gray-600 mb-3">Class of {member.graduating_year} • {member.major}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {member.description || `${member.title} at Yale Central Asian Society`}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Join the Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-padded">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold mb-6"
            >
              Join Our Team
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 mb-8 leading-relaxed"
            >
              Interested in promoting Central Asian culture at Yale? We're always looking for passionate individuals to join our team.
            </motion.p>
            <motion.a
              href="mailto:central.asian.society@yale.edu"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="inline-block bg-[#004aab] text-white px-8 py-3 rounded-lg hover:bg-[#003d8f] transition-colors"
            >
              Contact Us
            </motion.a>
          </div>
        </div>
      </section>
    </div>
  );
}; 