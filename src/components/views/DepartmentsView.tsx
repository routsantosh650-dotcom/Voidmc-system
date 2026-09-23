import React from 'react';
import { useVoidMC } from '../../context/VoidMCContext';
import { LayoutGrid, Users, Shield } from 'lucide-react';
import { getRoleColorStyles, getRoleIcon } from '../../utils/roleHelpers';

export const DepartmentsView: React.FC = () => {
  const { rolesList, staffList } = useVoidMC();

  // Group roles by department
  const departments = Array.from(new Set(rolesList.map(r => r.department)));

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#130a2a]/90 p-5 rounded-2xl border border-purple-500/30 shadow-xl shadow-purple-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 shadow-md">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              Server Departments & Hierarchies
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/70 mt-0.5">
              Organizational structure across executive, moderation, development, and community.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map(dept => {
          const deptRoles = rolesList.filter(r => r.department === dept);
          const deptStaff = staffList.filter(s => s.department === dept);

          return (
            <div key={dept} className="p-4 rounded-2xl bg-[#140c2e]/90 border border-purple-500/25 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">{dept}</h3>
                <span className="text-xs text-purple-300 font-mono-code">
                  {deptStaff.length} Staff · {deptRoles.length} Roles
                </span>
              </div>

              <div className="space-y-2">
                {deptRoles.map(role => {
                  const styles = getRoleColorStyles(role.color);
                  return (
                    <div
                      key={role.id}
                      className={`p-2.5 rounded-xl border ${styles.border} ${styles.bg} flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${styles.iconBg}`}>
                          {getRoleIcon(role.iconType, 'w-3 h-3')}
                        </div>
                        <span className="text-xs font-bold text-white uppercase">{role.name}</span>
                      </div>
                      <span className="text-xs text-purple-300/80 font-mono-code">
                        {role.memberCount} Members
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
