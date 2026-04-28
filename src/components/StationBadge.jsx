import { cn } from "@/lib/utils";

const colorMap = {
  red: "bg-red-100 text-red-700 border-red-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  green: "bg-green-100 text-green-700 border-green-200",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  purple: "bg-purple-100 text-purple-700 border-purple-200",
  teal: "bg-teal-100 text-teal-700 border-teal-200",
  pink: "bg-pink-100 text-pink-700 border-pink-200",
  yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const dotMap = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  teal: "bg-teal-500",
  pink: "bg-pink-500",
  yellow: "bg-yellow-500",
};

export default function StationBadge({ name, color, className }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      colorMap[color] || colorMap.blue,
      className
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dotMap[color] || dotMap.blue)} />
      {name}
    </span>
  );
}