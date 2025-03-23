"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { FaThLarge, FaFileAlt, FaUsers } from "react-icons/fa"
import { Switch } from "@/components/ui/switch"

export function Sidebar() {
  const menuItems = [
    { icon: <FaThLarge size={18} />, label: "Dashboard", description: "System Overview and Insights", href: "/dashboard" },
    { icon: <FaUsers size={18} />, label: "Entities", description: "Manage Your Entities", href: "/entities" },
    { icon: <FaFileAlt size={18} />, label: "Reports", description: "View and Generate Reports", href: "/reports" },
  ]

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-screen w-full py-5 max-w-[300px] bg-white border-r border-gray-200 flex flex-col"
    >
      <div className="p-6 space-y-6 flex-1">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-center">SW VISTA</h1>
          <p className="text-sm text-gray-800 text-center leading-tight">System-Wide Identity and Service Tool for Administration</p>
        </div>

        {/* System Name & Theme Toggle */}
        <div className="space-y-4">
          <p className="text-md text-center font-bold">SW-Vista</p>
          <div className="flex items-center justify-between">
            <span className="text-sm">Dark Theme</span>
            <Switch />
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
              className="border-b border-gray-200"
            >
              <Link 
                href={item.href}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="mt-1 text-gray-700">{item.icon}</span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500 leading-tight">{item.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-6 border-t border-gray-200">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </motion.button>
      </div>
    </motion.div>
  )
}
