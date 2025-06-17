// src/JobCard.jsx
import { useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import EditJobModal from "./EditJobModal";
import { supabase } from "./supabase";

export default function JobCard({ job, onDelete, onEdit }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
      <div className="border rounded p-4 shadow-sm bg-white hover:shadow-md transition-shadow duration-150">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{job.title}</h3>
            <p className="text-gray-600 mt-1">{job.description}</p>
          </div>

          <div className="flex flex-col items-end gap-1 ml-4">
            <button
              onClick={() => setShowEditModal(true)}
              className="text-blue-600 hover:underline text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-red-500 hover:underline text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          message={`Delete job: "${job.title}"? This action cannot be undone.`}
          onConfirm={async () => {
            const { error } = await supabase.from("jobs").delete().eq("id", job.id);
            if (!error) onDelete(job.id);
            setShowDeleteModal(false);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {showEditModal && (
        <EditJobModal
          job={job}
          onUpdate={(updatedJob) => {
            onEdit(updatedJob);
            setShowEditModal(false);
          }}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
