import React, { useState } from 'react';
import StaffDirectory from './StaffDirectory';
import StaffAttendance from './StaffAttendance';
import Payroll from './Payroll';
import LeaveRequests from './LeaveRequests';
import LeaveTypes from './LeaveTypes';
import Departments from './Departments';
import Designations from './Designations';

export default function HRModule() {
  const [activeHRTab, setActiveHRTab] = useState('directory');

  const tabs = [
    { id: 'directory', label: 'Staff Directory' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'leave-requests', label: 'Leave Requests' },
    { id: 'leave-types', label: 'Leave Types' },
    { id: 'departments', label: 'Departments' },
    { id: 'designations', label: 'Designations' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-navigation for HR */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveHRTab(tab.id)}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors uppercase tracking-wider ${
              activeHRTab === tab.id
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render Active Component */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4">
        {activeHRTab === 'directory' && <StaffDirectory disabled={false} isERPMode={true} />}
        {activeHRTab === 'attendance' && <StaffAttendance isERPMode={true} />}
        {activeHRTab === 'payroll' && <Payroll isERPMode={true} />}
        {activeHRTab === 'leave-requests' && <LeaveRequests isERPMode={true} />}
        {activeHRTab === 'leave-types' && <LeaveTypes isERPMode={true} />}
        {activeHRTab === 'departments' && <Departments isERPMode={true} />}
        {activeHRTab === 'designations' && <Designations isERPMode={true} />}
      </div>
    </div>
  );
}
