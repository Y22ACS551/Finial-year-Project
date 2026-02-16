import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import axiosWrapper from "../utils/AxiosWrapper";
import Heading from "../components/Heading";
import Loading from "../components/Loading";

const Tnp = ({ userRole }) => {
  /* ===============================
     STATE
  =============================== */
  const [tnps, setTnps] = useState([]);
  const [drives, setDrives] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [brochureFile, setBrochureFile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showDriveForm, setShowDriveForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
  });

  const [driveForm, setDriveForm] = useState({
    title: "",
    description: "",
    deadline: "",
    minMarks: "",
  });

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
      const formData = new FormData();
      formData.append("title", driveForm.title);
      formData.append("description", driveForm.description);
      formData.append("deadline", driveForm.deadline);
      formData.append("minMarks", driveForm.minMarks);

      if (brochureFile) {
        formData.append("brochure", brochureFile);
      }

      await axiosWrapper.post("/tnp/drive", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Drive created successfully");
      setShowDriveForm(false);
      setDriveForm({
        title: "",
        description: "",
        deadline: "",
        minMarks: "",
      });
      setBrochureFile(null);
      fetchDrives();
    } catch {
      toast.error("Failed to create drive");
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

      await axiosWrapper.post(
        `/tnp/drive/${driveId}/apply`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("Applied successfully");
      setResumeFile(null);
      fetchDrives();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Application failed"
      );
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
              <input required placeholder="Title"
                className="w-full border p-2 rounded"
                value={form.title}
                onChange={(e)=>setForm({...form,title:e.target.value})}
              />
              <textarea required placeholder="Description"
                className="w-full border p-2 rounded"
                value={form.description}
                onChange={(e)=>setForm({...form,description:e.target.value})}
              />
              <input type="date"
                className="w-full border p-2 rounded"
                value={form.deadline}
                onChange={(e)=>setForm({...form,deadline:e.target.value})}
              />
              <div className="flex justify-end gap-3">
                <button type="button"
                  onClick={()=>setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded">
                  {editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-10">
        {tnps.map((item)=>(
          <div key={item._id} className="border p-4 rounded bg-white">
            <h3 className="font-semibold">{item.title}</h3>
            <p>{item.description}</p>

            <div className="flex gap-4 mt-3 flex-wrap">
              {userRole==="student" && (
                <button
                  onClick={()=>toggleSeen(item._id)}
                  className="px-3 py-1 bg-green-500 text-white rounded">
                  Mark Seen
                </button>
              )}

              {(userRole==="admin"||userRole==="faculty") && (
                <>
                  <button onClick={()=>startEdit(item)} className="text-yellow-600">Edit</button>
                  <button onClick={()=>deleteTnp(item._id)} className="text-red-600">Delete</button>
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
              <input required placeholder="Title"
                className="w-full border p-2 rounded"
                value={driveForm.title}
                onChange={(e)=>setDriveForm({...driveForm,title:e.target.value})}
              />
              <textarea required placeholder="Description"
                className="w-full border p-2 rounded"
                value={driveForm.description}
                onChange={(e)=>setDriveForm({...driveForm,description:e.target.value})}
              />
              <input type="date"
                className="w-full border p-2 rounded"
                value={driveForm.deadline}
                onChange={(e)=>setDriveForm({...driveForm,deadline:e.target.value})}
              />
              <input type="number"
                placeholder="Minimum Marks"
                className="w-full border p-2 rounded"
                value={driveForm.minMarks}
                onChange={(e)=>setDriveForm({...driveForm,minMarks:e.target.value})}
              />
              <input type="file"
                accept=".pdf"
                onChange={(e)=>setBrochureFile(e.target.files[0])}
              />
              <div className="flex justify-end gap-3">
                <button type="button"
                  onClick={()=>setShowDriveForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {drives.map((drive)=>(
          <div key={drive._id} className="border p-4 rounded bg-gray-50">
            <h3 className="font-semibold">{drive.title}</h3>
            <p>{drive.description}</p>

            {userRole==="student" && (
              <div className="mt-3 space-y-2">
                <input type="file"
                  onChange={(e)=>setResumeFile(e.target.files[0])}
                />
                <button
                  onClick={()=>applyToDrive(drive._id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded">
                  Apply
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default Tnp;