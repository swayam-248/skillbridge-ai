import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApplicationsTracker = ({ userRole }) => {
  const [applications, setApplications] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole === 'worker') {
      fetchMyApplications();
    } else {
      fetchMyJobs();
    }
  }, [userRole]);

  const fetchMyApplications = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/applications/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyJobs = async () => {
    try {
      const token = sessionStorage.getItem('token');
      // For now we'll just fetch all jobs and filter on client or assume recruiter wants their jobs
      const res = await axios.get('http://localhost:5000/api/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyJobs(res.data); // In a real app we'd filter by recruiter: me
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async (jobId) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/applications/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplicants(res.data);
      setSelectedJobId(jobId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (userRole === 'worker') {
    return (
      <div className="animate-in fade-in duration-500">
        <h2 className="text-3xl font-black text-white mb-8 tracking-tight">Your Applications</h2>
        {loading ? (
          <div className="text-center text-slate-400">Loading...</div>
        ) : applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app._id} className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{app.job?.title}</h3>
                  <p className="text-slate-400 text-sm">Recruiter: {app.job?.recruiter?.email}</p>
                  <p className="text-slate-500 text-xs mt-1">Applied on: {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                    app.status === 'pending' ? 'bg-amber-950/50 text-amber-400 border border-amber-800/50' :
                    app.status === 'accepted' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50">
            <p className="text-slate-400 font-bold uppercase tracking-widest">You haven't applied to any jobs yet.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-white tracking-tight">
          {selectedJobId ? 'Applicants' : 'Select a Job to View Applicants'}
        </h2>
        {selectedJobId && (
          <button 
            onClick={() => setSelectedJobId(null)}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors"
          >
            ← Back to Jobs
          </button>
        )}
      </div>

      {!selectedJobId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myJobs.map(job => (
            <div 
              key={job._id} 
              onClick={() => fetchApplicants(job._id)}
              className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-slate-800/50 hover:border-blue-500/50 cursor-pointer transition-all group"
            >
              <h3 className="text-2xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors">{job.title}</h3>
              <p className="text-slate-400 text-sm mb-4">Click to view people who applied</p>
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <span>View Applicants</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {applicants.length > 0 ? (
            applicants.map(app => (
              <div key={app._id} className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-slate-800/50">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white mb-1">{app.profile?.fullName || 'Anonymous Worker'}</h3>
                    <p className="text-blue-400 font-bold mb-4">{app.worker?.email}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {app.profile?.skills?.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-950/50 text-slate-300 border border-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {typeof s === 'string' ? s : s.professional_title}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto flex flex-col gap-2">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:scale-105 transition-all">
                      Review Profile
                    </button>
                    <button className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold border border-slate-700 hover:bg-slate-700 transition-all">
                      Contact Applicant
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-900/40 rounded-[2.5rem] border border-slate-800/50">
              <p className="text-slate-400 font-bold uppercase tracking-widest">No applicants yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationsTracker;
