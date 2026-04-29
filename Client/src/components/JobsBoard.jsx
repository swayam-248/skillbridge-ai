import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JobsBoard = ({ userRole }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const fetchJobs = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      await axios.post('http://localhost:5000/api/jobs', { title, description }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTitle('');
      setDescription('');
      fetchJobs();
      alert('Job posted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to post job');
    }
  };

  const handleApply = async (id) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/jobs/${id}/apply`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Applied successfully! Recruiter will be notified.');
    } catch (err) {
      console.error(err);
      alert('Error applying');
    }
  };

  if (userRole === 'recruiter') {
    return (
      <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-slate-800/50 max-w-2xl mx-auto mt-12 animate-in fade-in duration-500">
        <h2 className="text-3xl font-black text-white mb-6">Post a New Job</h2>
        <form onSubmit={handlePostJob} className="space-y-6">
          <div>
            <label className="block text-slate-400 font-bold mb-2">Job Title</label>
            <input 
              required
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-white"
              placeholder="e.g. Master Plumber Needed" 
            />
          </div>
          <div>
            <label className="block text-slate-400 font-bold mb-2">Description & Requirements</label>
            <textarea 
              required
              rows={4}
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-white"
              placeholder="Detail the job..." 
            />
          </div>
          <button type="submit" className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20">
            Post Job to Board
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-white mb-8 tracking-tight">Available Jobs</h2>
      {loading ? (
        <div className="text-center text-slate-400">Loading jobs...</div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map(job => (
            <div key={job._id} className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-slate-800/50 hover:border-slate-700 transition-colors">
              <h3 className="text-2xl font-black text-white mb-2">{job.title}</h3>
              <span className="inline-block px-3 py-1 bg-blue-900/30 text-blue-400 border border-blue-800/50 rounded-full text-xs font-bold mb-4">
                Recruiter: {job.recruiter?.email || 'Unknown'}
              </span>
              <p className="text-slate-300 font-medium mb-6 line-clamp-3">{job.description}</p>
              <button onClick={() => handleApply(job._id)} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all">
                Apply Now
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50">
          <p className="text-slate-400 font-bold uppercase tracking-widest">No jobs available right now.</p>
        </div>
      )}
    </div>
  );
};

export default JobsBoard;
