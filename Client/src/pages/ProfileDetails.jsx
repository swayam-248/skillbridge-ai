import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ProfileDetail = () => {
  const { id } = useParams(); // This grabs the ID from the URL bar
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchSingleProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:5000/api/profiles/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching profile details", err);
      }
    };
    fetchSingleProfile();
  }, [id]);

  if (!profile) return <div>Loading Profile...</div>;

  return (
    <div className="antigravity-container">
      <h1>{profile.fullName}</h1>
      <p className="text-blue-600 font-bold">{profile.user?.email}</p>
      <hr />
      <h3>Professional Skills</h3>
      <ul>
        {profile.skills?.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      {/* This is where we will eventually put the AI transformation stories */}
    </div>
  );
};

export default ProfileDetail;
