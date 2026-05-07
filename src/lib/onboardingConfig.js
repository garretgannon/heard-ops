/**
 * Onboarding Configuration
 * Restaurant types, roles, team sizes, and flow metadata
 */

import {
  UtensilsCrossed, Wine, Coffee, Utensils, Flame,
  Truck, Croissant, Building2
} from "lucide-react";

export const RESTAURANT_TYPES = [
  {
    id: "full-service",
    label: "Full Service",
    icon: UtensilsCrossed,
    description: "Sit-down dining with servers",
    templates: 18,
    stations: ["Expo", "Garde Manger", "Grill", "Saute", "Pastry", "Bar"],
    sideWorkTemplates: ["Opening FOH", "Closing FOH", "Closing Kitchen"],
  },
  {
    id: "fast-casual",
    label: "Fast Casual",
    icon: Flame,
    description: "Counter service with speed focus",
    templates: 12,
    stations: ["Counter", "Assembly", "Grill", "Fryer", "Prep"],
    sideWorkTemplates: ["Opening", "Closing", "Mid-shift"],
  },
  {
    id: "bar-lounge",
    label: "Bar / Lounge",
    icon: Wine,
    description: "Beverage-focused with snacks",
    templates: 10,
    stations: ["Bar Back", "Service Bar", "Cocktail Station"],
    sideWorkTemplates: ["Opening Bar", "Closing Bar", "Restock"],
  },
  {
    id: "coffee-shop",
    label: "Coffee Shop",
    icon: Coffee,
    description: "Espresso-based with pastries",
    templates: 8,
    stations: ["Espresso", "Pastry", "Counter", "Prep"],
    sideWorkTemplates: ["Opening", "Closing", "Stock"],
  },
  {
    id: "fine-dining",
    label: "Fine Dining",
    icon: Utensils,
    description: "High-touch service & precision",
    templates: 20,
    stations: ["Amuse", "Appetizers", "Mains", "Sauces", "Plating", "Pastry"],
    sideWorkTemplates: ["Opening Service", "Table Reset", "Closing"],
  },
  {
    id: "food-truck",
    label: "Food Truck",
    icon: Truck,
    description: "Mobile quick service",
    templates: 6,
    stations: ["Grill", "Assembly", "Window"],
    sideWorkTemplates: ["Opening", "Closing", "Cleaning"],
  },
  {
    id: "bakery",
    label: "Bakery",
    icon: Croissant,
    description: "Baked goods and pastries",
    templates: 9,
    stations: ["Oven", "Proofing", "Decorating", "Packaging"],
    sideWorkTemplates: ["Early Prep", "Closing", "Cleaning"],
  },
  {
    id: "hotel-restaurant",
    label: "Hotel Restaurant",
    icon: Building2,
    description: "Multi-service hotel dining",
    templates: 24,
    stations: ["Restaurant", "Room Service", "Banquet", "Bar", "Kitchen"],
    sideWorkTemplates: ["Opening", "Mid-service", "Closing", "Event Prep"],
  },
];

export const USER_ROLES = [
  {
    id: "owner",
    label: "Owner",
    description: "Restaurant owner",
    icon: "👨‍💼",
    dashboardPriority: ["labor", "revenue", "operations", "team"],
  },
  {
    id: "general-manager",
    label: "General Manager",
    description: "Overall operations",
    icon: "📋",
    dashboardPriority: ["operations", "labor", "team", "compliance"],
  },
  {
    id: "chef",
    label: "Executive Chef",
    description: "Kitchen & menu",
    icon: "👨‍🍳",
    dashboardPriority: ["prep", "quality", "operations", "team"],
  },
  {
    id: "kitchen-lead",
    label: "Kitchen Lead",
    description: "Shift kitchen ops",
    icon: "🔥",
    dashboardPriority: ["prep", "operations", "handoff", "temp"],
  },
  {
    id: "foh-manager",
    label: "FOH Manager",
    description: "Front of house",
    icon: "🎯",
    dashboardPriority: ["side-work", "handoff", "team", "reservations"],
  },
  {
    id: "shift-lead",
    label: "Shift Lead",
    description: "Team lead",
    icon: "⭐",
    dashboardPriority: ["handoff", "tasks", "operations", "alerts"],
  },
];

export const TEAM_SIZES = [
  { id: "1-10", label: "1–10 people", value: 5, permissions: "relaxed" },
  { id: "10-25", label: "10–25 people", value: 18, permissions: "structured" },
  { id: "25-50", label: "25–50 people", value: 38, permissions: "formal" },
  { id: "50+", label: "50+ people", value: 75, permissions: "enterprise" },
];

export const ONBOARDING_STEPS = [
  { step: 1, title: "Welcome", icon: "🎬" },
  { step: 2, title: "Restaurant Type", icon: "🏪" },
  { step: 3, title: "Your Role", icon: "👤" },
  { step: 4, title: "Team Size", icon: "👥" },
  { step: 5, title: "Building", icon: "⚙️" },
  { step: 6, title: "Demo Tour", icon: "🎮" },
  { step: 7, title: "Ready!", icon: "🎉" },
];

export const DEMO_COACH_MARKS = [
  {
    target: "prep-item",
    title: "Complete a prep item",
    description: "Tap to mark items as complete. Swipe to see details.",
    position: "bottom",
  },
  {
    target: "side-work",
    title: "Assign side work",
    description: "Tap to assign tasks. Mark complete when done.",
    position: "bottom",
  },
  {
    target: "manager-handoff",
    title: "Shift handoffs",
    description: "Managers review handoffs here. Important for continuity.",
    position: "bottom",
  },
  {
    target: "critical-alert",
    title: "Critical alerts",
    description: "Temperature failures, overdue items appear here. Act fast.",
    position: "top",
  },
  {
    target: "today-view",
    title: "Your command center",
    description: "Real-time snapshot of everything happening right now.",
    position: "bottom",
  },
];

export const NEXT_STEPS_TASKS = [
  {
    id: "add-employees",
    title: "Add Employees",
    description: "Invite your team members",
    icon: "👥",
    priority: "high",
  },
  {
    id: "upload-schedule",
    title: "Upload Schedule",
    description: "Import weekly staff schedule",
    icon: "📅",
    priority: "high",
  },
  {
    id: "customize-templates",
    title: "Customize Templates",
    description: "Adjust prep lists and checklists",
    icon: "📝",
    priority: "medium",
  },
  {
    id: "add-inventory",
    title: "Add Inventory",
    description: "Import your purchased items",
    icon: "📦",
    priority: "medium",
  },
  {
    id: "add-vendors",
    title: "Add Vendors",
    description: "Contact and ordering info",
    icon: "🚚",
    priority: "low",
  },
  {
    id: "integrations",
    title: "Connect Integrations",
    description: "POS, scheduling, HR systems",
    icon: "🔗",
    priority: "low",
  },
];