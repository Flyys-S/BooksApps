interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  iconBgColor: string;
  iconTextColor: string;
}

export default function StatCard({ icon, value, label, iconBgColor, iconTextColor }: StatCardProps) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl shadow-xl flex items-center gap-4 relative overflow-hidden group">
      <div className={`p-3 ${iconBgColor} ${iconTextColor} rounded-2xl group-hover:scale-105 transition-transform duration-300`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-white leading-none tracking-tight">{value}</p>
        <p className="text-xs text-zinc-400 font-semibold mt-1">{label}</p>
      </div>
    </div>
  );
}
