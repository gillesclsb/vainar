import { useEffect, useState } from "react";
import { api } from "./api/api";
import Auth from "./pages/Auth";
import AvatarBuilder from "./pages/AvatarBuilder";
import Community from "./pages/Community";
import MusicController from "./music/MusicController";
import Friends from "./pages/Friends";
import Settings from "./pages/Settings";

export default function App() {
  const musicController = <MusicController />;
  const [view, setView] = useState("loading");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("vainaarToken");

    if (!token) {
      setView("auth");
      return;
    }

    api.me()
      .then(data => {
        setUser(data.user);
        setView(data.user.avatarDone ? "community" : "avatar");
      })
      .catch(() => {
        localStorage.removeItem("vainaarToken");
        setView("auth");
      });
  }, []);

  if (view === "loading") return <>{musicController}<div className="loading-screen">VAINAAR STARTING...</div></>;

  if (view === "auth") {
    return <>{musicController}<Auth onAuthenticated={nextUser => {
      setUser(nextUser);
      setView(nextUser.avatarDone ? "community" : "avatar");
    }} /></>;
  }

  if (view === "avatar") {
    return <>{musicController}<AvatarBuilder
      user={user}
      onSaved={nextUser => {
        setUser(nextUser);
        setView("community");
      }}
      onCancel={user.avatarDone ? () => setView("community") : null}
    /></>;
  }

  if (view === "friends") {
    return <>{musicController}<Friends user={user} onBack={() => setView("community")} /></>;
  }

  if (view === "settings") {
    return <>{musicController}<Settings
      user={user}
      onBack={() => setView("community")}
      onEditAvatar={() => setView("avatar")}
    /></>;
  }

  return <>{musicController}<Community
    user={user}
    onFriends={() => setView("friends")}
    onSettings={() => setView("settings")}
    onEditAvatar={() => setView("avatar")}
    onLogout={() => {
      localStorage.removeItem("vainaarToken");
      setUser(null);
      setView("auth");
    }}
  /></>;
}
