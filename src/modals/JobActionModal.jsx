import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { toast } from "react-hot-toast";
import TaskChecklist from "../components/TaskChecklist";

// Note: EditView sub-component is omitted for brevity as it remains unchanged.

export default function JobActionModal({ job, onClose, onChecklistUpdate, currentUserId, userRole }) {
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [loadingTaskId, setLoadingTaskId] = useState(null);

  const isJobCompleted = job.status === 'completed';

  const fetchTasks = useCallback(async () => {
    if (!job.id) return;
    setIsLoadingTasks(true);
    const { data, error } = await supabase.from('job_tasks').select('*').eq('job_id', job.id).order('created_at');
    if (error) { toast.error("Could not fetch job tasks.") } else { setTasks(data) }
    setIsLoadingTasks(false);
  }, [job.id]);

  useEffect(() => {
    fetchTasks();
  }, [job.id]);

  // This function now handles both task updates and the final job completion
  const handleToggleTask = async (taskToToggle) => {
    setLoadingTaskId(taskToToggle.id);
    const isNowDone = !taskToToggle.is_done;

    const { data: updatedTask, error: taskError } = await supabase
      .from('job_tasks').update({ is_done: isNowDone, completed_at: isNowDone ? new Date().toISOString() : null, completed_by: currentUserId })
      .eq('id', taskToToggle.id).select().single();

    if (taskError) {
      toast.error('Task update failed.');
      setLoadingTaskId(null);
      return;
    }

    // Instantly update the local state to make the UI feel responsive
    const newTasks = tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(newTasks);

    const allTasksDone = newTasks.every(t => t.is_done);
    let finalUpdatedJob = { ...job }; // Start with the current job state

    if (allTasksDone && job.status !== 'completed') {
      const { data, error } = await supabase.from('jobs').update({ status: 'completed', job_completed_at: new Date().toISOString() }).eq('id', job.id).select().single();
      if (data && !error) {
        toast.success('Job complete!');
        finalUpdatedJob = data; // The job was successfully updated
      } else {
        toast.error('Error completing job.');
      }
    } else if (!allTasksDone && job.status === 'completed') {
      const { data, error } = await supabase.from('jobs').update({ status: 'in_progress', job_completed_at: null }).eq('id', job.id).select().single();
      if (data && !error) {
        toast.success("Job status reverted.");
        finalUpdatedJob = data; // The job was successfully updated
      } else {
        toast.error('Error reverting job status.');
      }
    }
    
    // Notify the main App component of the final state of the job
    onChecklistUpdate(finalUpdatedJob);
    setLoadingTaskId(null);
  };
  
  const handleAcceptJob = async () => {
    const { data, error } = await supabase.from('jobs').update({ provider_id: currentUserId, status: 'in_progress' }).eq('id', job.id).is('provider_id', null).select().single();
    if (error || !data) {
      toast.error("Failed to accept job.");
      onClose();
    } else {
      toast.success("Job accepted!");
      onChecklistUpdate(data);
    }
  };

  const detailItem = (label, value) => (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-gray-900">{value || <span className="text-gray-400">Not specified</span>}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Job Details</h2>
          {isJobCompleted && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Completed</span>}
        </div>
        <div className="space-y-4 mb-6">
          {detailItem("Title", job.title)}
          <div>
            {isLoadingTasks ? (<p>Loading tasks...</p>) : (
              <TaskChecklist
                tasks={tasks}
                userId={currentUserId}
                userRole={userRole}
                providerId={job.provider_id}
                onToggleTask={handleToggleTask}
                loadingTaskId={loadingTaskId}
              />
            )}
          </div>
        </div>
        <div className="flex justify-end gap-4 border-t pt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Close</button>
          
          {userRole === 'service_provider' && !job.provider_id && (
            <button onClick={handleAcceptJob} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Accept Job</button>
          )}
        </div>
      </div>
    </div>
  );
}
