import React, { useState } from 'react';
import { Event } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Alert } from '../common/Alert';

interface EventFormProps {
  event?: Event;
  onSubmit: (eventData: Partial<Event>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export const EventForm: React.FC<EventFormProps> = ({
  event,
  onSubmit,
  onCancel,
  isSubmitting,
  error
}) => {
  const [formData, setFormData] = useState<Partial<Event>>({
    title: event?.title || '',
    description: event?.description || '',
    start_date: event?.start_date || '',
    end_date: event?.end_date || '',
    venue: event?.venue || '',
    registration_link: event?.registration_link || '',
    cover_image: event?.cover_image || '',
    category: event?.category || 'OTHER',
    capacity: event?.capacity || undefined,
    is_active: event?.is_active || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : undefined }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <Input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Start Date & Time *
          </label>
          <Input
            id="start_date"
            name="start_date"
            type="datetime-local"
            value={formData.start_date}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            End Date & Time
          </label>
          <Input
            id="end_date"
            name="end_date"
            type="datetime-local"
            value={formData.end_date}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
          Venue *
        </label>
        <Input
          id="venue"
          name="venue"
          type="text"
          value={formData.venue}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="registration_link" className="block text-sm font-medium text-gray-700">
          Registration Link
        </label>
        <Input
          id="registration_link"
          name="registration_link"
          type="url"
          value={formData.registration_link}
          onChange={handleChange}
          placeholder="https://"
        />
      </div>

      <div>
        <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700">
          Cover Image URL
        </label>
        <Input
          id="cover_image"
          name="cover_image"
          type="url"
          value={formData.cover_image}
          onChange={handleChange}
          placeholder="https://"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="SEMINAR">Seminar</option>
            <option value="SOCIAL">Social Event</option>
            <option value="WORKSHOP">Workshop</option>
            <option value="CONFERENCE">Conference</option>
            <option value="CULTURAL">Cultural Event</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
            Capacity
          </label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            value={formData.capacity || ''}
            onChange={handleChange}
            placeholder="Leave empty for unlimited"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          checked={formData.is_active}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
          Active (visible to public)
        </label>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {event ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
}; 