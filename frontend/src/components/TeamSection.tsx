import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';
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

export const TeamSection = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get<TeamMember[]>('http://localhost:8000/auth/team/');
      
      // Filter for main users only and ensure we have an array
      const members = Array.isArray(response.data) ? response.data.filter(member => member.is_main) : [];

      // Sort users: President first, then Board members
      const sortedMembers = [...members].sort((a, b) => {
        if (a.role === 'PRESIDENT') return -1;
        if (b.role === 'PRESIDENT') return 1;
        return 0;
      });

      setTeamMembers(sortedMembers);
    } catch (err: any) {
      console.error('Error fetching team members:', err);
      setError('Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#004aab]"></div>
      </div>
    );
  }

  if (error) {
    return null; // Hide section if there's an error
  }

  if (!teamMembers.length) {
    return null; // Hide section if no main members
  }

  return (
    <section className="py-20">
      <div className="container-padded">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold">Our Team</h2>
            <Link 
              to="/team"
              className="text-sm font-medium text-black hover:text-gray-600 transition-colors"
            >
              Meet the whole team →
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-12">
            {teamMembers.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center w-[calc(50%-24px)] md:w-[calc(25%-36px)]"
              >
                <img 
                  src={member.profile_picture || DEFAULT_AVATAR}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-32 h-32 rounded-full mb-4 object-cover"
                />
                <h3 className="font-medium">{`${member.first_name} ${member.last_name}`}</h3>
                <p className="text-sm text-gray-500">{member.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}; 