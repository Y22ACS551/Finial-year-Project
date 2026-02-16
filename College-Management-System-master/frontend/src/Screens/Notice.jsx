import React, { useEffect, useState,useCallback } from "react";
import axiosWrapper from "../utils/AxiosWrapper";
import toast from "react-hot-toast";

const Notice = () => {
  /* ================= AUTH ================= */
  const userType = localStorage.getItem("userType"); // Admin | Faculty | Student
  const isStudent = userType === "Student";
  const isStaff = userType === "Admin" || userType === "Faculty";

  /* ================= STATE ================= */
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  const [noticeCount, setNoticeCount] = useState({
    read: 0,
    unread: 0,
  });

  /* ===== CREATE MODAL ===== */
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "student", // student | both
  });

  /* ================= FETCH NOTICES ================= */
  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      const url = isStudent ? "/notices/student" : "/notices";
      const res = await axiosWrapper.get(url);
      setNotices(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  },[isStudent]);

  /* ================= FETCH COUNT ================= */
  const fetchNoticeCount = useCallback(async () => {
    try {
      // Student → personal count
      if (isStudent) {
        const res = await axiosWrapper.get("/notices/student/count");
        setNoticeCount(res.data);
      }

      // Admin / Faculty → student aggregate count
      if (isStaff) {
        const res = await axiosWrapper.get("/notices/count");
        setNoticeCount(res.data);
      }
    } catch (err) {
      console.error("Count fetch error", err);
    }
  },[isStudent,isStaff]);

  /* ================= MARK AS READ (STUDENT) ================= */
  const markAsRead = async (id) => {
    try {
      await axiosWrapper.put(`/notices/seen/${id}`);
      fetchNotices();
      fetchNoticeCount();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notice");
    }
  };

  /* ================= CREATE NOTICE (ADMIN / FACULTY) ================= */
  const createNotice = async () => {
    try {
      if (!form.title || !form.message) {
        return toast.error("All fields required");
      }

      await axiosWrapper.post("/notices", form);
      toast.success("Notice created");

      setForm({ title: "", message: "", type: "student" });
      setShowModal(false);
      fetchNotices();
      fetchNoticeCount();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create notice");
    }
  };

  /* ================= DELETE NOTICE (ADMIN / FACULTY) ================= */
  const deleteNotice = async (id) => {
    if (!window.confirm("Delete this notice?")) return;

    try {
      await axiosWrapper.delete(`/notices/${id}`);
      toast.success("Notice deleted");
      fetchNotices();
      fetchNoticeCount();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    fetchNotices();
    fetchNoticeCount();
  },[fetchNotices,fetchNoticeCount]);

  /* ================= UI ================= */
  return (
    <div className="p-6">
      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notices</h1>

        {isStaff && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            + Create Notice
          </button>
        )}
      </div>

      {/* ===== READ / UNREAD BADGES (ALL ROLES) ===== */}
      <div className="flex gap-4 mb-6">
        <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
          Unread: {noticeCount.unread}
        </span>
        <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
          Read: {noticeCount.read}
        </span>
      </div>

      {/* ===== CONTENT ===== */}
      {loading ? (
        <p>Loading...</p>
      ) : notices.length === 0 ? (
        <p className="text-gray-500">No notices found</p>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div
              key={notice._id}
              className={`p-4 rounded-xl border ${
                notice.isSeen
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
              }`}
            >
              <h2 className="font-semibold text-lg">{notice.title}</h2>
              <p className="text-sm text-gray-700 mt-1">
                {notice.message}
              </p>

              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-500">
                  {new Date(notice.createdAt).toLocaleDateString()}
                </span>

                <div className="flex gap-3">
                  {/* STUDENT READ */}
                  {isStudent && !notice.isSeen && (
                    <button
                      onClick={() => markAsRead(notice._id)}
                      className="text-sm px-3 py-1 rounded-lg bg-blue-600 text-white"
                    >
                      Mark as Read
                    </button>
                  )}

                  {isStudent && notice.isSeen && (
                    <span className="text-sm text-green-700 font-medium">
                      Read
                    </span>
                  )}

                  {/* ADMIN / FACULTY DELETE */}
                  {isStaff && (
                    <button
                      onClick={() => deleteNotice(notice._id)}
                      className="text-sm px-3 py-1 rounded-lg bg-red-600 text-white"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== CREATE MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create Notice</h2>

            <input
              type="text"
              placeholder="Title"
              className="w-full mb-3 p-2 border rounded"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <textarea
              placeholder="Message"
              className="w-full mb-3 p-2 border rounded"
              rows={4}
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
            />

            <select
              className="w-full mb-4 p-2 border rounded"
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value })
              }
            >
              <option value="student">Students</option>
              <option value="both">All</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={createNotice}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notice;