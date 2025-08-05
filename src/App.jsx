import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';
import Auth from './Auth';
import JobForm from './JobForm';
import JobList from './JobList';
import JobActionModal from './modals/JobActionModal';
import UpdatePasswordModal from './modals/UpdatePasswordModal';
import { Toaster, toast } from 'react-hot-toast';

function Header({ session, onLogout }) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-4xl mx-auto py-4 px-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">CleanerApp MkV</h1>
        {session && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.email}</span>
            <button onClick={onLogout} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}

function FilterControls({ filter, setFilter, sort, setSort, userRole }) {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm border mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            id="filter"
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="listed">{userRole === 'customer' ? 'Listed' : 'Open'}</option>
            <option value="accepted">{userRole === 'customer' ? 'Accepted' : 'In Progress'}</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
            Sort by
          </label>
          <select
            id="sort"
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="budget_high">Budget: High to Low</option>
            <option value="budget_low">Budget: Low to High</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function ClientDashboard({ user, jobs, loading, onSelectJob, onNewJob, currentUserId, userRole, filter, setFilter, sort, setSort }) {
  return (
    <div className="space-y-8">
      <JobForm user={user} onNewJob={onNewJob} />
      <FilterControls filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} userRole={userRole} />
      <JobList jobs={jobs} loading={loading} onSelectJob={onSelectJob} currentUserId={currentUserId} userRole={userRole} />
    </div>
  );
}

function CleanerDashboard({ jobs, loading, onSelectJob, currentUserId, userRole, filter, setFilter, sort, setSort }) {
  return (
    <div className="bg-white shadow border rounded-md p-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Available Jobs</h2>
            <p className="mt-2 text-gray-600">This is where a cleaner will see a list of jobs to accept.</p>
        </div>
      </div>
      <div className="mt-6">
        <FilterControls filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} userRole={userRole} />
        <JobList jobs={jobs} loading={loading} onSelectJob={onSelectJob} currentUserId={currentUserId} userRole={userRole} />
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);

  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setShowUpdatePassword(true);
      setSession(session);
      if (event === 'SIGNED_OUT') setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    if (!session) {
        setLoading(false);
        return;
    }
    
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profileError) {
        toast.error('Error fetching user profile.');
    } else {
        setProfile(profileData);
    }

    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('*, job_tasks(*)')
      .order('created_at', { ascending: false });

    if (jobsError) {
        toast.error('Could not fetch jobs.');
    } else {
        setJobs(jobsData);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchInitialData();

    const jobsChannel = supabase
      .channel('realtime:jobs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
        fetchInitialData();
      })
      .subscribe();

    return () => supabase.removeChannel(jobsChannel);
  }, [session]);

  const displayedJobs = useMemo(() => {
    let filtered = [...jobs];

    if (filter !== 'all') {
      filtered = filtered.filter(job => {
        const isCompleted = job.status === 'completed';
        const isAccepted = !!job.provider_id;

        if (filter === 'listed') return !isAccepted && !isCompleted;
        if (filter === 'accepted') return isAccepted && !isCompleted;
        if (filter === 'completed') return isCompleted;
        return true;
      });
    }

    switch (sort) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'budget_high':
        filtered.sort((a, b) => (b.budget || 0) - (a.budget || 0));
        break;
      case 'budget_low':
        filtered.sort((a, b) => (a.budget || 0) - (b.budget || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return filtered;
  }, [jobs, filter, sort]);

  const handleNewJob = (newJob) => {
    fetchInitialData();
  };

  const handleDeleteJob = async (jobId) => {
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) {
      toast.error(`Failed to delete job: ${error.message}`);
    } else {
      toast.success("Job deleted!");
      setSelectedJob(null);
    }
  };

  const handleUpdateJob = (updatedJob) => {
    setJobs((prevJobs) => prevJobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    setSelectedJob(updatedJob); // Also update the selected job to reflect changes immediately
  };
  
  const handleChecklistUpdate = (updatedJob) => {
    setJobs((prevJobs) => prevJobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    setSelectedJob(updatedJob);
  };

  const renderDashboard = () => {
    if (!profile) return <div className="text-center p-4">Loading user profile...</div>;
    
    const dashboardProps = {
      jobs: displayedJobs,
      loading: loading,
      onSelectJob: setSelectedJob,
      currentUserId: session.user.id,
      userRole: profile.role,
      filter: filter,
      setFilter: setFilter,
      sort: sort,
      setSort: setSort,
    };

    if (profile.role === 'customer') {
      return <ClientDashboard {...dashboardProps} user={session.user} onNewJob={handleNewJob} />;
    } else if (profile.role === 'service_provider') {
      return <CleanerDashboard {...dashboardProps} />;
    } else {
      return <div className="text-center p-4">Unknown user role. Please contact support.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <Header session={session} onLogout={async () => { await supabase.auth.signOut(); setSession(null); setProfile(null); }} />
      <main className="max-w-4xl mx-auto py-6">{!session ? <Auth /> : renderDashboard()}</main>

      {selectedJob && profile && (
        <JobActionModal
          job={selectedJob}
          currentUserId={session.user.id}
          userRole={profile.role}
          onClose={() => setSelectedJob(null)}
          onUpdate={handleUpdateJob}
          onChecklistUpdate={handleChecklistUpdate}
          onDelete={handleDeleteJob}
        />
      )}

      {showUpdatePassword && <UpdatePasswordModal onUpdatePassword={() => setShowUpdatePassword(false)} />}
    </div>
  );
}