import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { toast } from "react-hot-toast";
import { Link } from 'react-router-dom';
import TaskChecklist from "../components/TaskChecklist";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { validateJobForm, getToday, getMaxDate } from "../utils/validation";
import JobStatusBadge from "../components/JobStatusBadge";
import TaskSummaryBadge from "../components/TaskSummaryBadge";

function AuditLogViewer({ logs, isLoading }) {
  const isUUIDish = (s) =>
    typeof s === "string" && s.length > 30 && /^[0-9a-f-]+$/i.test(s);
  const isNoisyKey = (k) => /(_id|_by|_at)$/i.test(k);

  const labelize = (k) =>
    String(k || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Job History</h3>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : !logs?.length ? (
        <div className="text-sm text-gray-500">No history yet.</div>
      ) : (
        <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-md border">
          <ul className="space-y-3">
            {logs.map((row) => {
              const key = row.id || `${row.occurred_at}-${row.action}`;
              const action = String(row.action || "").replace(/_/g, " ");
              const when = row.occurred_at
                ? new Date(row.occurred_at).toLocaleString()
                : "";
              const actor =
                row.actor_label || row.actor_email || row.actor_id || "System";
              const details = row.details || {};

              // 1) Preferred: details.changes = { field: {old,new}, ... }
              let diffs = [];
              if (details && typeof details === "object" && details.changes) {
                const ch = details.changes;
                if (ch && typeof ch === "object") {
                  diffs = Object.entries(ch).map(([field, pair]) => ({
                    field,
                    old: pair?.old,
                    newer: pair?.new,
                  }));
                }
              }

              // 2) Fallback: details.old/new objects
              if (!diffs.length && details?.old && details?.new) {
                const oldObj = details.old || {};
                const newObj = details.new || {};
                const keys = new Set([
                  ...Object.keys(oldObj),
                  ...Object.keys(newObj),
                ]);
                keys.forEach((k) => {
                  if (oldObj[k] !== newObj[k]) {
                    diffs.push({ field: k, old: oldObj[k], newer: newObj[k] });
                  }
                });
              }

              // 3) Legacy/simple payloads (scalar keys like is_done, category, task_description)
              const simpleEntries =
                !diffs.length && details && typeof details === "object"
                  ? Object.entries(details).filter(([k, v]) => {
                      if (k === "changes") return false; // handled above
                      if (isNoisyKey(k)) return false;
                      const s = String(v ?? "");
                      if (isUUIDish(s)) return false;
                      return true;
                    })
                  : [];

              return (
                <li key={key} className="bg-white p-2 rounded border">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">
                      {action.replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                    <div className="text-xs text-gray-500">{when}</div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">by {actor}</div>

                  {/* Diffs (clean old → new) */}
                  {!!diffs.length && (
                    <ul className="mt-2 text-xs text-gray-700 space-y-0.5">
                      {diffs.map((d, idx) => (
                        <li key={idx}>
                          <span className="font-medium">{labelize(d.field)}</span>
                          : <span className="text-gray-500">{String(d.old)}</span> →{" "}
                          <span>{String(d.newer)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Simple key/value fallback (never prints [object Object]) */}
                  {!diffs.length && !!simpleEntries.length && (
                    <ul className="mt-2 text-xs text-gray-700 space-y-0.5">
                      {simpleEntries.map(([k, v], idx) => (
                        <li key={idx}>
                          <span className="font-medium">{labelize(k)}</span>
                          : <span>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function EditView({ job, initialTasks, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: job.title || "",
    location: job.location || "",
    date: job.date || "",
    time: job.time || "",
    budget: job.budget || "",
  });
  const [tasks, setTasks] = useState(initialTasks);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentTask, setCurrentTask] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState({ category: '', description: '' });
  const editTaskRef = useRef(null);

  const handleSaveTaskLocally = (taskId) => {
    if (!editingTaskText.category.trim() || !editingTaskText.description.trim()) {
      toast.error("Both category and description are required.");
      setEditingTaskId(null); // Exit edit mode even if invalid
      return;
    }
    setTasks(currentTasks => currentTasks.map(task => 
      task.id === taskId 
        ? { ...task, category: editingTaskText.category.trim(), task_description: editingTaskText.description.trim() } 
        : task
    ));
    setEditingTaskId(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingTaskId && editTaskRef.current && !editTaskRef.current.contains(event.target)) {
        handleSaveTaskLocally(editingTaskId);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingTaskId, editingTaskText]); // Rerun effect when editingTaskText changes to get latest value

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = (address) => {
    setFormData((prev) => ({ ...prev, location: address }));
  };

  const handleAddTask = () => {
    if (!currentTask.trim()) {
      toast.error("Please enter a task description.");
      return;
    }
    const newTask = {
      id: -Date.now(),
      category: currentCategory.trim() || 'General',
      task_description: currentTask.trim(),
    };
    setTasks([...tasks, newTask]);
    setCurrentTask('');
    setCurrentCategory('');
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  const handleEditTask = (task) => {
    if (editingTaskId) {
      handleSaveTaskLocally(editingTaskId);
    }
    setEditingTaskId(task.id);
    setEditingTaskText({ category: task.category, description: task.task_description });
  };

  const handleSubmit = async () => {
    setMessage("");
    const validation = validateJobForm(formData);
    if (!validation.isValid) {
      setMessage(validation.message);
      return;
    }

    setSaving(true);
    
    const { error: jobUpdateError } = await supabase
      .from("jobs")
      .update({
        title: formData.title,
        location: formData.location,
        date: formData.date,
        time: formData.time,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      })
      .eq("id", job.id);
      
    if (jobUpdateError) {
      toast.error(`Error updating job: ${jobUpdateError.message}`);
      setSaving(false);
      return;
    }

    const initialTaskMap = new Map(initialTasks.map(t => [t.id, t]));
    const tasksToAdd = tasks.filter(t => t.id < 0).map(({ category, task_description }) => ({ job_id: job.id, category, task_description }));
    const tasksToDelete = initialTasks.filter(it => !tasks.some(ct => ct.id === it.id)).map(t => t.id);
    const tasksToUpdate = tasks.filter(task => {
        if (task.id <= 0) return false;
        const initial = initialTaskMap.get(task.id);
        return initial && (task.category !== initial.category || task.task_description !== initial.task_description);
    });

    let taskError = null;
    if (tasksToAdd.length > 0) {
      const { error } = await supabase.from('job_tasks').insert(tasksToAdd);
      if (error) taskError = error;
    }
    if (!taskError && tasksToUpdate.length > 0) {
        for (const task of tasksToUpdate) {
            const { error } = await supabase
                .from('job_tasks')
                .update({ category: task.category, task_description: task.task_description })
                .eq('id', task.id);
            if (error) {
                taskError = error;
                break;
            }
        }
    }
    if (!taskError && tasksToDelete.length > 0) {
      const { error } = await supabase.from('job_tasks').delete().in('id', tasksToDelete);
      if (error) taskError = error;
    }

    if (taskError) {
        toast.error(`Job details saved, but failed to sync tasks: ${taskError.message}`);
    } else {
      toast.success("Job updated successfully!");
    }
    
    const { data: finalJobData } = await supabase.from('jobs').select('*, job_tasks(*), client:profiles!client_id(*), provider:profiles!provider_id(*)').eq('id', job.id).single();
    onSave(finalJobData);
    setSaving(false);
  };
  
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            options.push(
                <option key={timeString} value={timeString}>
                    {timeString}
                </option>
            );
        }
    }
    return options;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Job</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Job Title</label>
        <input className="mt-1 w-full p-2 border rounded" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <LocationAutocomplete onSelectAddress={handleLocationSelect} initialValue={formData.location} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input className="mt-1 w-full p-2 border rounded" type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} min={getToday()} max={getMaxDate()} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Time</label>
          <select 
            className="mt-1 w-full p-2 border rounded bg-white" 
            value={formData.time} 
            onChange={(e) => handleChange('time', e.target.value)} 
            required
          >
            <option value="">Select a time</option>
            {generateTimeOptions()}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Budget (£)</label>
          <input className="mt-1 w-full p-2 border rounded" type="number" step="0.01" min="0" max="999" value={formData.budget} onChange={(e) => handleChange('budget', e.target.value)} />
        </div>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Checklist of Tasks</h3>
        <div className="p-4 bg-gray-50 rounded-md space-y-3">
          <div className="flex items-end gap-2">
            <div className="w-1/3"><label className="block text-xs font-medium text-gray-600">Category</label><input className="mt-1 w-full p-2 border rounded" value={currentCategory} onChange={e => setCurrentCategory(e.target.value)} placeholder="e.g., Kitchen" /></div>
            <div className="w-2/3"><label className="block text-xs font-medium text-gray-600">Task</label><input className="mt-1 w-full p-2 border rounded" value={currentTask} onChange={e => setCurrentTask(e.target.value)} placeholder="e.g., Mop the floor" /></div>
            <button type="button" onClick={handleAddTask} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 font-semibold">Add</button>
          </div>
        </div>
        <ul className="mt-4 space-y-2 max-h-40 overflow-y-auto">
          {tasks.map(task => (
            <li key={task.id} className="p-2 bg-white border rounded-md">
                {editingTaskId === task.id ? (
                    <div ref={editTaskRef} className="flex gap-2">
                      <input 
                        className="w-1/3 p-2 border rounded" 
                        value={editingTaskText.category} 
                        onChange={e => setEditingTaskText({...editingTaskText, category: e.target.value})} 
                        placeholder="Category"
                        autoFocus
                      />
                      <input 
                        className="w-2/3 p-2 border rounded" 
                        value={editingTaskText.description} 
                        onChange={e => setEditingTaskText({...editingTaskText, description: e.target.value})} 
                        placeholder="Description"
                      />
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                        <p className="text-gray-700"><span className="font-semibold">{task.category}:</span> {task.task_description}</p>
                        <div className="flex gap-4">
                          <button type="button" onClick={() => handleEditTask(task)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">Edit</button>
                          <button type="button" onClick={() => handleDeleteTask(task.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
                        </div>
                    </div>
                )}
            </li>
          ))}
          {tasks.length === 0 && <p className="text-sm text-gray-500 text-center">No tasks added yet.</p>}
        </ul>
      </div>
      
      {message && <p className="text-sm text-center font-medium text-red-600">{message}</p>}

      <div className="flex justify-end gap-4 border-t pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancel</button>
        <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
      </div>
    </div>
  );
}


export default function JobActionModal({ job, onClose, onUpdate, onChecklistUpdate, onDelete, currentUserId, userRole }) {
  const [tasks, setTasks] = useState(job.job_tasks || []);
  const [loadingTaskId, setLoadingTaskId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
  const [interestedProviders, setInterestedProviders] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [auditRows, setAuditRows] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const isJobOwner = userRole === 'customer' && job.client_id === currentUserId;
  const isUnassigned = !job.provider_id;
  const hasInterest = Array.isArray(interestedProviders) && interestedProviders.length > 0;
  const canEdit = isJobOwner && isUnassigned && !hasInterest;
  const isAssignedProvider = userRole === 'service_provider' && job.provider_id === currentUserId;
  const canViewHistory = isJobOwner || isAssignedProvider;

  useEffect(() => {
    const checkInterest = async () => {
      if (userRole === 'service_provider' && job.id && currentUserId) {
        const { data } = await supabase.from('job_interests').select('id').eq('job_id', job.id).eq('provider_id', currentUserId).maybeSingle();
        setHasExpressedInterest(!!data);
      }
    };
    
    const fetchInterestedProviders = async () => {
      if (isJobOwner && isUnassigned) {
        const { data, error } = await supabase.rpc('get_interested_providers', { p_job_id: job.id });
        if (error) {
          toast.error("Could not fetch interested providers.");
        } else {
          setInterestedProviders(data || []);
        }
      }
    };

    checkInterest();
    fetchInterestedProviders();
    setIsEditMode(false);
    setTasks(job.job_tasks || []);
  }, [job, currentUserId, userRole, isJobOwner, isUnassigned]);

  useEffect(() => {
    if (!showHistory || !job?.id) return;
    (async () => {
      setLoadingLogs(true);
      const { data, error } = await supabase.rpc('get_job_audit_log', { p_job_id: job.id });
      if (error) {
        toast.error('Failed to load job history.');
        setAuditRows([]);
      } else {
        setAuditRows(data || []);
      }
      setLoadingLogs(false);
    })();
  }, [showHistory, job?.id]);

  const handleAssignJob = async (providerId) => {
    setIsAssigning(true);
    const { data: updatedJob, error } = await supabase.rpc('assign_job_to_provider', { p_job_id: job.id, p_provider_id: providerId });
    if (error) {
      toast.error(`Failed to assign job: ${error.message}`);
    } else {
      toast.success("Job assigned successfully!");
      onUpdate(updatedJob);
    }
    setIsAssigning(false);
  };
  
  const handleToggleTask = async (taskToToggle) => {
    setLoadingTaskId(taskToToggle.id);
    const isNowDone = !taskToToggle.is_done;
    const { data: updatedTask, error: taskError } = await supabase.from('job_tasks').update({ is_done: isNowDone, completed_at: isNowDone ? new Date().toISOString() : null, completed_by: currentUserId }).eq('id', taskToToggle.id).select().single();
    if (taskError) {
      toast.error('Task update failed.');
      setLoadingTaskId(null);
      return;
    }
    const newTasks = tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(newTasks);
    const allTasksDone = newTasks.every(t => t.is_done);
    let updatedJobForState = { ...job, job_tasks: newTasks };
    if (allTasksDone && job.status !== 'completed') {
      const { data, error } = await supabase.from('jobs').update({ status: 'completed', job_completed_at: new Date().toISOString() }).eq('id', job.id).select('*, client:profiles!client_id(*), provider:profiles!provider_id(*)').single();
      if (data && !error) {
        toast.success('Job complete!');
        updatedJobForState = { ...updatedJobForState, ...data };
      }
    } else if (!allTasksDone && job.status === 'completed') {
      const { data, error } = await supabase.from('jobs').update({ status: 'in_progress', job_completed_at: null }).eq('id', job.id).select('*, client:profiles!client_id(*), provider:profiles!provider_id(*)').single();
      if (data && !error) {
        toast.success("Job status reverted.");
        updatedJobForState = { ...updatedJobForState, ...data };
      }
    }
    onChecklistUpdate(updatedJobForState);
    setLoadingTaskId(null);
  };
  
// In src/modals/JobActionModal.jsx

  const handleExpressInterest = async (jobId) => {
    // 1. Express interest in the database.
    const { error: interestError } = await supabase.rpc('express_interest_in_job', { p_job_id: jobId });

    if (interestError) {
      const msg = (interestError.message || '').toLowerCase();
      if (msg.includes('interest_limit_reached')) {
        toast.error("This job has already reached the maximum interest level.");
      } else if (msg.includes('already_interested')) {
        toast.error("You've already shown interest in this job.");
      } else {
        toast.error("Failed to express interest. Please try again.");
      }
      return;
    }

    toast.success("Interest recorded!");

    // 2. IMPORTANT: Re-fetch the single, updated job record from the database.
    // We use the same RPC that the main job list uses to get all the fresh data.
    const { data: updatedJob, error: fetchError } = await supabase
      .rpc('get_jobs_for_provider', { p_provider_id: currentUserId })
      .eq('id', jobId) // Filter the RPC results to just this one job
      .single();

    if (fetchError) {
      // If the fetch fails, the app state won't update, but the interest was still recorded.
      // A manual refresh would show the correct state.
      toast.error("Could not refresh job data automatically.");
    } else if (updatedJob) {
      // 3. Pass the fresh, complete job object back up to App.jsx.
      // This is the exact same pattern used by handleToggleTask.
      onUpdate(updatedJob);
    }
  };
  
  const handleShareJob = () => {
    const jobUrl = `${window.location.origin}/job/${job.id}`;
    navigator.clipboard.writeText(jobUrl)
      .then(() => toast.success('Job link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link.'));
  };

  const detailItem = (label, value) => (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {React.isValidElement(value) ? 
        <div className="mt-1">{value}</div> : 
        <p className="mt-1 text-gray-900">{value || <span className="text-gray-400">Not specified</span>}</p>
      }
    </div>
  );
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDisplayName = (profile) => {
    if (!profile) return '...';
    return profile.company_name || profile.full_name || profile.email;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        
        {isEditMode ? (
          <EditView 
            job={job}
            initialTasks={tasks}
            onSave={(updatedJob) => {
              onUpdate(updatedJob);
              setIsEditMode(false);
            }}
            onCancel={() => setIsEditMode(false)}
          />
        ) : (
          <>
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold text-gray-800">Job Details</h2>
              <JobStatusBadge job={job} currentUserId={currentUserId} userRole={userRole} />
            </div>
            
            <TaskSummaryBadge job={job} />

            <div className="space-y-4 my-6">
              {detailItem("Title", job.title)}
              {detailItem("Location", job.location)}
              {detailItem("Date", new Date(job.date).toLocaleDateString())}
              {detailItem("Time", job.time)}
              {detailItem("Budget", job.budget ? `£${job.budget}` : 'Not specified')}
              
              {!isUnassigned && job.provider && userRole === 'customer' && (
                detailItem(
                  "Assigned To",
                  <Link 
                    to={`/profile/${job.provider.id}`} 
                    className="text-blue-600 hover:underline font-medium" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    {job.provider.company_name || job.provider.full_name || job.provider.email}
                  </Link>
                )
              )}
              {!isUnassigned && job.client && userRole === 'service_provider' && (
                detailItem("Client", getDisplayName(job.client))
              )}

              <div>
                <TaskChecklist
                    tasks={tasks}
                    userId={currentUserId}
                    userRole={userRole}
                    providerId={job.provider_id}
                    onToggleTask={handleToggleTask}
                    loadingTaskId={loadingTaskId}
                />
              </div>
            </div>

            {isJobOwner && isUnassigned && (
              <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Interested Providers</h3>
                    {job.interest_limit && <p className="text-sm text-gray-500">{interestedProviders.length} of {job.interest_limit} spots taken</p>}
                  </div>
                <ul className="mt-2 space-y-2">
                  {interestedProviders.map(provider => {
                    const displayName = provider.company_name || provider.full_name || provider.email;
                    return (
                      <li key={provider.provider_id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex-shrink-0">
                            {provider.avatar_url ? (
                              <img src={supabase.storage.from('avatars').getPublicUrl(provider.avatar_url).data.publicUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-300" />
                            )}
                          </div>
                          <Link to={`/profile/${provider.provider_id}`} className="text-blue-600 hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                            {displayName}
                          </Link>
                        </div>
                        <button onClick={() => handleAssignJob(provider.provider_id)} disabled={isAssigning} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 flex-shrink-0">
                          {isAssigning ? '...' : 'Assign Job'}
                        </button>
                      </li>
                    )}
                  )}
                </ul>
              </div>
            )}
            
            {showHistory && <AuditLogViewer logs={auditRows} isLoading={loadingLogs} />}

            <div className="text-xs text-gray-400 space-y-1 border-t pt-4 mt-4">
                <p>Created: {formatTimestamp(job.created_at)}</p>
                {job.accepted_at && <p>Accepted: {formatTimestamp(job.accepted_at)}</p>}
                {job.job_completed_at && <p>Completed: {formatTimestamp(job.job_completed_at)}</p>}
            </div>

            <div className="flex justify-between items-center border-t pt-4 mt-4">
              <div className="flex gap-2">
                <button onClick={handleShareJob} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-semibold">
                  Copy Link
                </button>
                {canViewHistory && (
                  <button onClick={() => setShowHistory((s)=>!s)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-semibold">
                    {showHistory ? 'Hide History' : 'Show History'}
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Close</button>
                {canEdit && (<button onClick={() => setIsEditMode(true)} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit Job</button>)}
                
                {userRole === 'service_provider' && isUnassigned && (
                  <button onClick={() => handleExpressInterest(job.id)} disabled={hasExpressedInterest} className={`px-4 py-2 font-semibold text-white rounded transition-colors ${hasExpressedInterest ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {hasExpressedInterest ? "Interest Expressed" : "I'm Interested"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}