import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "sky" | "orange" | "green" | "red"; 
}

export default function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colorStyles = {
    sky: "bg-sky-50 text-sky-600 border-sky-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    green: "bg-green-50 text-green-600 border-green-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className={`p-6 rounded-2xl border ${colorStyles[color]} shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <h3 className="text-3xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full bg-white/60 backdrop-blur-sm shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}