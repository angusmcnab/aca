import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

const fmtTime = (ts) => (ts ? new Date(ts).toLocaleString() : 'N/A');
const displayName = (p) => p?.company_name || p?.full_name || p?.email || 'Unknown';

export default function JobHistory({ job }) {
  const [entries, setEntries] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [loading, setLoading] = useState(true);

  // 1) Fetch raw audit rows
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!job?.id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_log')
        .select('id, occurred_at, actor_id, action, entity, details')
        .eq('job_id', job.id)
        .order('occurred_at', { ascending: false });
      if (error) {
        toast.error('Failed to load job history.');
        console.error(error);
      } else if (!cancelled) {
        setEntries(data || []);
      }
      if (!cancelled) setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [job?.id]);

  // 2) Collect all provider UUIDs used in diffs (old/new for provider_id)
  const providerIds = useMemo(() => {
    const ids = new Set();
    for (const e of entries) {
      const list = e?.details?.details || [];
      for (const d of list) {
        if (d?.field === 'provider_id') {
          if (d.old) ids.add(d.old);
          if (d.new) ids.add(d.new);
        }
      }
    }
    return Array.from(ids);
  }, [entries]);

  // 3) Fetch all those profiles in one call and cache
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!providerIds.length) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, email')
        .in('id', providerIds);
      if (error) {
        console.warn('Could not fetch provider names for history:', error);
        return;
      }
      if (!cancelled) {
        const map = {};
        for (const p of data || []) map[p.id] = p;
        setProfilesById(map);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [providerIds]);

  if (loading) return <p className="text-center text-gray-500">Loading history...</p>;
  if (!entries.length) return <p className="text-center text-gray-500">No history available for this job.</p>;

  const renderDetail = (d) => {
    // Provider UUID → Name
    if (d.field === 'provider_id') {
      const oldP = d.old ? profilesById[d.old] : null;
      const newP = d.new ? profilesById[d.new] : null;
      const oldLabel = d.old ? (oldP ? displayName(oldP) : 'Unassigned') : 'Unassigned';
      const newLabel = d.new ? (newP ? displayName(newP) : 'Unknown') : 'Unassigned';
      return (
        <p>
          <strong className="font-semibold">Provider:</strong>{' '}
          <span className="text-gray-500 line-through">{oldLabel}</span> →{' '}
          <span className="text-green-700 font-semibold">{newLabel}</span>
        </p>
      );
    }
    // Generic fields
    const fmt = (v) => (v === null || typeof v === 'undefined' ? 'null' : String(v));
    const label = (d.field || '').replace(/_/g, ' ');
    return (
      <p>
        <strong className="font-semibold capitalize">{label}:</strong>{' '}
        <span className="text-gray-500 line-through">{fmt(d.old)}</span> →{' '}
        <span className="text-green-700 font-semibold">{fmt(d.new)}</span>
      </p>
    );
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
      <h3 className="text-lg font-semibold text-gray-800">Job History</h3>
      {entries.map((e) => (
        <div key={e.id} className="p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-gray-900">{e.entity} {e.action}</p>
            <p className="text-xs text-gray-500">{fmtTime(e.occurred_at)}</p>
          </div>
          {/* actor line (optional: look up actor profile similarly if you want) */}
          <div className="text-sm space-y-1">
            {(e.details?.details || []).map((d, i) => <div key={i}>{renderDetail(d)}</div>)}
          </div>
        </div>
      ))}
    </div>
  );
}
