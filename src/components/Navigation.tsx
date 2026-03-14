import { NavLink } from "react-router-dom";
import { Home, MessageCircle, Brain, Settings, User, Users } from "lucide-react";
import { motion } from "framer-motion";

const links = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/characters", icon: Users, label: "Characters" },
  { to: "/mentor", icon: User, label: "Mentor" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/aptitude", icon: Brain, label: "Learn" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto">
      <div className="mx-auto md:max-w-full">
        <div className="flex items-center justify-between md:justify-start gap-0 md:gap-1 px-1 md:px-4 py-1.5 md:py-0 bg-card/80 backdrop-blur-xl border-t md:border-b md:border-t-0 border-border">
          <div className="hidden md:flex items-center gap-2 px-4 py-3 mr-4">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">X</span>
            </div>
            <span className="font-semibold text-foreground tracking-tight">XOVA</span>
          </div>

          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col md:flex-row items-center gap-0.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-3 rounded-lg text-[9px] md:text-sm font-medium transition-colors relative ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="truncate">{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute -top-0.5 md:bottom-0 md:top-auto left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
