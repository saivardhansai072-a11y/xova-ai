import { NavLink } from "react-router-dom";
import { Home, MessageCircle, Brain, Settings, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const links = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/aptitude", icon: Brain, label: "Learn" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto">
      <div className="mx-auto max-w-lg md:max-w-full">
        <div className="flex items-center justify-between md:justify-start gap-1 px-4 py-2 md:py-0 bg-card/80 backdrop-blur-xl border-t md:border-b md:border-t-0 border-border">
          {/* Logo - desktop only */}
          <div className="hidden md:flex items-center gap-2 px-4 py-3 mr-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground tracking-tight">XOVA</span>
          </div>

          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary md:hidden"
                      />
                    )}
                  </div>
                  <span>{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator-desktop"
                      className="hidden md:block absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
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
