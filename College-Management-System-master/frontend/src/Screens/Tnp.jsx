import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import axiosWrapper from "../utils/AxiosWrapper";
import Heading from "../components/Heading";
import Loading from "../components/Loading";
import { FaFilePdf, FaFileCsv } from "react-icons/fa";

const Tnp = ({ userRole }) => {
  /* ===============================
     STATE
  =============================== */
  const [tnps, setTnps] = useState([]);
  const [drives, setDrives] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [attachmentFile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showDriveForm, setShowDriveForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    minMarks: "",
    googleFormLink: "",
  });

  const [driveForm, setDriveForm] = useState({
    title: "",
    description: "",
    deadline: "",
    minMarks: "",
  });
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [exportOpenId, setExportOpenId] = useState(null);

  /* ===============================
     FETCH DATA
  =============================== */
  const fetchTnp = useCallback(async () => {
    try {
      const res = await axiosWrapper.get("/tnp");
      setTnps(res.data.data || []);
    } catch {
      toast.error("Failed to load T&P notices");
    }
  }, []);

  const fetchDrives = useCallback(async () => {
    try {
      const res = await axiosWrapper.get("/tnp/drive");
      setDrives(res.data.data || []);
    } catch {
      toast.error("Failed to load Drives");
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([fetchTnp(), fetchDrives()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchTnp, fetchDrives]);

  /* ===============================
     NOTICE FUNCTIONS
  =============================== */
  const total = tnps.length;
  const seen = tnps.filter((t) => t.seenBy?.length > 0).length;
  const unseen = total - seen;

  const resetForm = () => {
    setForm({ title: "", description: "", deadline: "" });
    setEditId(null);
    setShowForm(false);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axiosWrapper.put(`/tnp/${editId}`, form);
        toast.success("Notice updated");
      } else {
        await axiosWrapper.post("/tnp", form);
        toast.success("Notice created");
      }
      resetForm();
      fetchTnp();
    } catch {
      toast.error("Save failed");
    }
  };

  const startEdit = (item) => {
    setEditId(item._id);
    setForm({
      title: item.title,
      description: item.description,
      deadline: item.deadline?.split("T")[0] || "",
    });
    setShowForm(true);
  };

  const deleteTnp = async (id) => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await axiosWrapper.delete(`/tnp/${id}`);
      toast.success("Deleted");
      fetchTnp();
    } catch {
      toast.error("Delete failed");
    }
  };

  const toggleSeen = async (id) => {
    try {
      await axiosWrapper.patch(`/tnp/${id}/seen`);
      fetchTnp();
    } catch {
      toast.error("Failed");
    }
  };

  /* ===============================
     CREATE DRIVE
  =============================== */
  const submitDriveForm = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axiosWrapper.put(`/tnp/drive/${editId}`, driveForm);
        toast.success("Drive updated");
      } else {
        const formData = new FormData();
        formData.append("title", driveForm.title);
        formData.append("description", driveForm.description);
        formData.append("deadline", driveForm.deadline);
        formData.append("minMarks", driveForm.minMarks);
        formData.append("googleFormLink", driveForm.googleFormLink);

        if (attachmentFile) {
          formData.append("attachment", attachmentFile);
        }

        await axiosWrapper.post("/tnp/drive", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        toast.success("Drive created successfully");
      }

      setShowDriveForm(false);
      setEditId(null);
      fetchDrives();
    } catch {
      toast.error("Failed");
    }
  };

  /* ===============================
     APPLY TO DRIVE
  =============================== */
  const applyToDrive = async (driveId) => {
    try {
      if (!resumeFile) {
        toast.error("Please upload resume");
        return;
      }
      const formData = new FormData();
      formData.append("resume", resumeFile);

      await axiosWrapper.post(`/tnp/drive/${driveId}/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Applied successfully");
      setResumeFile(null);
      fetchDrives();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Application failed");
    }
  };
  const handleExport = async (driveId, status) => {
    try {
      const response = await axiosWrapper.get(
        `/tnp/export/${driveId}/${status}`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${status}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };
  const handleExportCSV = async (driveId, status) => {
    try {
      const response = await axiosWrapper.get(
        `/tnp/export-csv/${driveId}/${status}`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${status}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Failed to download CSV");
    }
  };
  const updateStatus = async (driveId, applicationId, status) => {
    try {
      await axiosWrapper.patch(
        `/tnp/drive/${driveId}/application/${applicationId}/status`,
        { status },
      );

      toast.success("Status updated");

      fetchDrives(); // refresh data
    } catch (error) {
      toast.error("Failed to update status");
    }
  };
  const handleEditDrive = (drive) => {
    setDriveForm({
      title: drive.title,
      description: drive.description,
      deadline: drive.deadline?.split("T")[0] || "",
      minMarks: drive.minMarks || "",
      googleFormLink: drive.googleFormLink || "",
    });

    setEditId(drive._id);
    setShowDriveForm(true);
  };
  const handleDeleteDrive = async (id) => {
    if (!window.confirm("Delete this drive?")) return;

    try {
      await axiosWrapper.delete(`/tnp/drive/${id}`);
      toast.success("Drive deleted");
      fetchDrives();
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="px-4 md:px-8 max-w-5xl mx-auto">
      <Heading title="Training & Placement" />

      {/* ================= NOTICE SECTION ================= */}
      <h2 className="text-xl font-semibold mt-6 mb-2">Notices</h2>

      {userRole === "student" && (
        <div className="mb-4 flex gap-6">
          <span className="text-red-600">Unread: {unseen}</span>
          <span className="text-green-600">Read: {seen}</span>
        </div>
      )}

      {(userRole === "admin" || userRole === "faculty") && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded my-4"
        >
          + Add Notice
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">
              {editId ? "Edit Notice" : "Create Notice"}
            </h2>

            <form onSubmit={submitForm} className="space-y-4">
              <input
                required
                placeholder="Title"
                className="w-full border p-2 rounded"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                required
                placeholder="Description"
                className="w-full border p-2 rounded"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-10">
        {tnps.map((item) => (
          <div key={item._id} className="border p-4 rounded bg-white">
            <h3 className="font-semibold">{item.title}</h3>
            <p>{item.description}</p>

            <div className="flex gap-4 mt-3 flex-wrap">
              {userRole === "student" && (
                <button
                  onClick={() => toggleSeen(item._id)}
                  className="px-3 py-1 bg-green-500 text-white rounded"
                >
                  Mark Seen
                </button>
              )}

              {(userRole === "admin" || userRole === "faculty") && (
                <>
                  <button
                    onClick={() => startEdit(item)}
                    className="text-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTnp(item._id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ================= DRIVE SECTION ================= */}
      <h2 className="text-xl font-semibold mt-6 mb-4">Placement Drives</h2>

      {(userRole === "admin" || userRole === "faculty") && (
        <button
          onClick={() => setShowDriveForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded mb-4"
        >
          + Create Drive
        </button>
      )}

      {showDriveForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Create Drive</h2>

            <form onSubmit={submitDriveForm} className="space-y-4">
              <input
                required
                placeholder="Title"
                className="w-full border p-2 rounded"
                value={driveForm.title}
                onChange={(e) =>
                  setDriveForm({ ...driveForm, title: e.target.value })
                }
              />
              <textarea
                required
                placeholder="Description"
                className="w-full border p-2 rounded"
                value={driveForm.description}
                onChange={(e) =>
                  setDriveForm({ ...driveForm, description: e.target.value })
                }
              />
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={driveForm.deadline}
                onChange={(e) =>
                  setDriveForm({ ...driveForm, deadline: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Minimum Marks"
                className="w-full border p-2 rounded"
                value={driveForm.minMarks}
                onChange={(e) =>
                  setDriveForm({ ...driveForm, minMarks: e.target.value })
                }
              />
              <input
                type="url"
                placeholder="Google Form Link (Optional)"
                className="w-full border p-2 rounded"
                value={driveForm.googleFormLink}
                onChange={(e) =>
                  setDriveForm({ ...driveForm, googleFormLink: e.target.value })
                }
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDriveForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {drives.map((drive) => (
          <div key={drive._id} className="border p-4 rounded bg-gray-50">
            <h3 className="font-semibold">{drive.title}</h3>
            <p>{drive.description}</p>
            <p className="text-sm text-gray-600">
              Deadline:
              {drive.deadline
                ? new Date(drive.deadline).toLocaleDateString()
                : "No deadline"}
            </p>
            <p className="text-sm text-blue-600 font-medium mt-2">
              Total Applicants:
              {drive.applications?.length || 0}
            </p>
            {/* shortlist count */}
            <div className="text-sm mt-1 space-y-1">
              <p className="text-green-600">
                Shortlisted:
                {drive.applications?.filter(
                  (app) => app.status === "SHORTLISTED",
                ).length || 0}
              </p>
            </div>
            <div className="text-sm mt-1 space-y-1">
              <p className="text-brown-600">
                Selected:
                {drive.applications?.filter((app) => app.status === "SELECTED")
                  .length || 0}
              </p>
            </div>
            <div className="text-sm mt-1 space-y-1">
              <p className="text-red-600">
                Rejected:
                {drive.applications?.filter((app) => app.status === "REJECTED")
                  .length || 0}
              </p>
            </div>
            {userRole === "student" && (
              <div className="mt-3 space-y-2">
                {drive.applications?.some(
                  (app) => app.studentId === localStorage.getItem("userId"),
                ) ? (
                  <p className="text-green-600 font-semibold">
                    ✅ Already Applied
                  </p>
                ) : drive.googleFormLink ? (
                  <>
                    <a
                      href={drive.googleFormLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-600 text-white rounded inline-block"
                    >
                      Apply via Google Form
                    </a>

                    <p className="text-xl text-gray-700 mt-2">
                      Applications collected externally.
                    </p>
                  </>
                ) : (
                  <>
                    <input
                      type="file"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                    />
                    <button
                      onClick={() => applyToDrive(drive._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Apply
                    </button>
                  </>
                )}

                {drive.attachment && (
                  <a
                    href={`http://localhost:4000/media/${drive.attachment}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline block mt-2"
                  >
                    View Attachment
                  </a>
                )}
              </div>
            )}
            {(userRole === "admin" || userRole === "faculty") && (
              <>
                <button
                  onClick={() => {
                    setSelectedDrive(drive);
                    setShowApplicantsModal(true);
                  }}
                  className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                >
                  View Applicants
                </button>
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => handleEditDrive(drive)}
                    className="text-yellow-600 hover:text-yellow-800 font-medium"
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() => handleDeleteDrive(drive._id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    🗑 Delete
                  </button>
                </div>
                <div className="relative inline-block text-left mt-2">
                  <button
                    onClick={() =>
                      setExportOpenId(
                        exportOpenId === drive._id ? null : drive._id,
                      )
                    }
                    className="px-3 py-1 bg-gradient-to-r from-gray-700 to-gray-900 
                    text-white rounded text-sm shadow hover:scale-105 transition"
                  >
                    Export ▼
                  </button>

                  {exportOpenId === drive._id && (
                    <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 text-white rounded shadow-xl z-10 overflow-hidden">
                      {/* APPLIED */}
                      <button
                        onClick={() => {
                          handleExport(drive._id, "APPLIED");
                          setExportOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-600 transition"
                      >
                        <FaFilePdf /> Applied (PDF)
                      </button>

                      <button
                        onClick={() => {
                          handleExportCSV(drive._id, "APPLIED");
                          setExportOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-600 transition"
                      >
                        <FaFileCsv /> Applied (CSV)
                      </button>

                      <div className="border-t border-gray-700"></div>

                      {/* SHORTLISTED */}
                      <button
                        onClick={() => {
                          handleExport(drive._id, "SHORTLISTED");
                          setExportOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-green-600 hover:text-white transition"
                      >
                        <FaFilePdf /> Shortlisted (PDF)
                      </button>

                      <button
                        onClick={() => {
                          handleExportCSV(drive._id, "SHORTLISTED");
                          setExportOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-green-600 hover:text-white transition"
                      >
                        <FaFileCsv /> Shortlisted (CSV)
                      </button>

                      <div className="border-t border-gray-700"></div>

                      {/* SELECTED */}
                      <button
                        onClick={() => {
                          handleExport(drive._id, "SELECTED");
                          setExportOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition"
                      >
                        <FaFilePdf /> Selected (PDF)
                      </button>

                      <button
                        onClick={() => {
                          handleExportCSV(drive._id, "SELECTED");
                          setExportOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition"
                      >
                        <FaFileCsv /> Selected (CSV)
                      </button>

                      <div className="border-t border-gray-700"></div>

                      {/* REJECTED */}
                      <button
                        onClick={() => {
                          handleExport(drive._id, "REJECTED");
                          setExportOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-red-600 hover:text-white transition"
                      >
                        <FaFilePdf /> Rejected (PDF)
                      </button>

                      <button
                        onClick={() => {
                          handleExportCSV(drive._id, "REJECTED");
                          setExportOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-red-600 hover:text-white transition"
                      >
                        <FaFileCsv /> Rejected (CSV)
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {showApplicantsModal && selectedDrive && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl p-6 shadow-lg max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              Applicants - {selectedDrive.title}
            </h2>

            {selectedDrive.applications?.length === 0 ? (
              <p className="text-gray-500">No applicants yet</p>
            ) : (
              <div className="space-y-3">
                {selectedDrive.applications.map((app) => (
                  <div
                    key={app._id}
                    className="border p-3 rounded flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">
                        Student Name:{app.studentId?.middleName || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Email:{app.studentId?.email || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Roll No:{app.studentId?.enrollmentNo || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Status: {app.status || "APPLIED"}
                      </p>
                      {(userRole === "admin" || userRole === "faculty") && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() =>
                              updateStatus(
                                selectedDrive._id,
                                app._id,
                                "SHORTLISTED",
                              )
                            }
                            className="px-2 py-1 bg-yellow-500 text-white text-xs rounded"
                          >
                            Shortlist
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(
                                selectedDrive._id,
                                app._id,
                                "SELECTED",
                              )
                            }
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded"
                          >
                            Select
                          </button>

                          <button
                            onClick={() =>
                              updateStatus(
                                selectedDrive._id,
                                app._id,
                                "REJECTED",
                              )
                            }
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {app.resume && (
                      <a
                        href={`http://localhost:4000/media/${app.resume}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-sm"
                      >
                        View Resume
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowApplicantsModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tnp;
