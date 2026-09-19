import React, { createContext, useContext, useState } from 'react';
import { useToast } from './ToastContext';

const JobComparisonContext = createContext(null);

export function JobComparisonProvider({ children }) {
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  const toggleCompareJob = (job) => {
    if (!job || !job.id) return;

    setSelectedJobs(prev => {
      const exists = prev.some(j => j.id === job.id);
      if (exists) {
        toast.info(`Removed "${job.title}" from comparison.`);
        return prev.filter(j => j.id !== job.id);
      }
      if (prev.length >= 3) {
        toast.warning('You can compare a maximum of 3 jobs at a time.');
        return prev;
      }
      toast.success(`Added "${job.title}" to comparison.`);
      return [...prev, job];
    });
  };

  const removeJob = (jobId) => {
    setSelectedJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const clearComparison = () => {
    setSelectedJobs([]);
    setIsModalOpen(false);
  };

  const isInComparison = (jobId) => {
    return selectedJobs.some(j => j.id === jobId);
  };

  return (
    <JobComparisonContext.Provider
      value={{
        selectedJobs,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        toggleCompareJob,
        removeJob,
        clearComparison,
        isInComparison
      }}
    >
      {children}
    </JobComparisonContext.Provider>
  );
}

export function useJobComparison() {
  const context = useContext(JobComparisonContext);
  if (!context) {
    throw new Error('useJobComparison must be used within a JobComparisonProvider');
  }
  return context;
}
