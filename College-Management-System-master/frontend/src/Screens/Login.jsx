import React, { useState, useEffect, useRef } from "react";
import { FiLogIn } from "react-icons/fi";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setUserToken } from "../redux/actions";
import CustomButton from "../components/CustomButton";
import axiosWrapper from "../utils/AxiosWrapper";

const USER_TYPES = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  ADMIN: "Admin",
};

const LoginForm = ({ selected, onSubmit, formData, setFormData }) => (
  <form onSubmit={onSubmit} autoComplete="off" className="login-glass-card">
    <div>
      <label className="login-label">{selected} Email</label>
      <input
        type="email"
        required
        value={formData.email}
        onChange={(e) =>
          setFormData({ ...formData, email: e.target.value })
        }
        className="login-input"
        placeholder={`Enter ${selected.toLowerCase()} email`}
      />
    </div>

    <div>
      <label className="login-label">Password</label>
      <input
        type="password"
        required
        value={formData.password}
        onChange={(e) =>
          setFormData({ ...formData, password: e.target.value })
        }
        className="login-input"
        placeholder="Enter password"
      />
    </div>

    <div className="login-forgot">
      <Link to="/forget-password">Forgot password?</Link>
    </div>

    <CustomButton type="submit" className="login-button">
      Login <FiLogIn />
    </CustomButton>
  </form>
);

const UserTypeSelector = ({ selected, onSelect }) => (
  <div className="login-role-wrap">
    {Object.values(USER_TYPES).map((type) => (
      <button
        key={type}
        onClick={() => onSelect(type)}
        className={`login-role ${selected === type ? "active" : ""}`}
      >
        {type}
      </button>
    ))}
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type");
  const cardRef = useRef(null);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [selected, setSelected] = useState(USER_TYPES.STUDENT);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const move = (e) => {
      if (window.innerWidth < 768) return;
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      card.style.transform = `
        rotateX(${-(y / r.height - 0.5) * 6}deg)
        rotateY(${(x / r.width - 0.5) * 6}deg)
      `;
    };

    const reset = () => {
      card.style.transform = "rotateX(0) rotateY(0)";
    };

    card.addEventListener("mousemove", move);
    card.addEventListener("mouseleave", reset);
    return () => {
      card.removeEventListener("mousemove", move);
      card.removeEventListener("mouseleave", reset);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const userType = localStorage.getItem("userType");
    if (token && userType) {
      navigate(`/${userType.toLowerCase()}`);
    }
  }, [navigate]);

  useEffect(() => {
    if (type) {
      const capType = type.charAt(0).toUpperCase() + type.slice(1);
      setSelected(capType);
    }
  }, [type]);

  const handleUserTypeSelect = (type) => {
    setSelected(type);
    setSearchParams({ type: type.toLowerCase() });
    setFormData({ email: "", password: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosWrapper.post(
        `/${selected.toLowerCase()}/login`,
        formData
      );
      const { token } = res.data.data;
      localStorage.setItem("userToken", token);
      localStorage.setItem("userType", selected);
      dispatch(setUserToken(token));
      navigate(`/${selected.toLowerCase()}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
        }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: url("/ocen-bg.jpg") center/cover no-repeat fixed;
          padding: 20px;
        }

        .login-wrapper {
          width: 100%;
          max-width: 760px;
          text-align: center;
        }

        .login-title {
          font-size: 40px;
          font-weight: 700;
          color: #020617;
          margin-bottom: 22px;
          text-shadow: 0 10px 30px rgba(255,255,255,0.35);
        }

        .login-role-wrap {
          display: flex;
          justify-content: center;
          gap: 18px;
          margin-bottom: 34px;
        }

        .login-role {
          padding: 14px 34px;
          border-radius: 999px;
          background: rgba(255,255,255,0.32);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.5);
          color: #020617;
          font-weight: 600;
          cursor: pointer;
        }

        .login-role.active {
          background: linear-gradient(135deg,#7dd3fc,#38bdf8);
          box-shadow: 0 16px 42px rgba(56,189,248,0.45);
        }

        /* 🖥 Desktop glass */
        .login-glass-card {
          width: 100%;
          padding: 46px 56px;
          border-radius: 36px;
          background: rgba(255,255,255,0.24);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.55);
          box-shadow:
            0 55px 140px rgba(0,0,0,0.35),
            inset 0 1px 1px rgba(255,255,255,0.6);
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        /* 📱 TRUE lighter mobile glass (image visible) */
        @media (max-width: 640px) {
          .login-glass-card {
            padding: 32px;
            border-radius: 28px;
            background: linear-gradient(
              180deg,
              rgba(255,255,255,0.12),
              rgba(255,255,255,0.08)
            );
            backdrop-filter: blur(6px);
            box-shadow:
              0 20px 50px rgba(0,0,0,0.18),
              inset 0 1px 1px rgba(255,255,255,0.35);
          }
        }

        .login-label {
          font-size: 18px;
          font-weight: 700;
          color: #020617;
          margin-bottom: 10px;
          display: block;
        }

        .login-input {
          width: 100%;
          padding: 18px 22px;
          border-radius: 18px;
          border: none;
          font-size: 16px;
          margin-bottom: 26px;
          background: rgba(255,255,255,0.88);
          color: #020617;
          outline: none;
        }

        .login-forgot {
          text-align: right;
          margin-bottom: 28px;
        }

        .login-forgot a {
          font-size: 14px;
          font-weight: 500;
          color: #020617;
        }

        .login-button {
          width: 100%;
          padding: 22px;
          font-size: 18px;
          font-weight: 700;
          border-radius: 26px;
          background: linear-gradient(135deg,#38bdf8,#60a5fa);
          color: #020617;
          box-shadow: 0 24px 58px rgba(56,189,248,0.45);
        }
      `}</style>

      <div className="login-page">
        <div className="login-wrapper">
          <div className="login-title">{selected} Login</div>

          <UserTypeSelector
            selected={selected}
            onSelect={handleUserTypeSelect}
          />

          <div ref={cardRef}>
            <LoginForm
              selected={selected}
              onSubmit={handleSubmit}
              formData={formData}
              setFormData={setFormData}
            />
          </div>
        </div>
        <Toaster position="bottom-center" />
      </div>
    </>
  );
};

export default Login;