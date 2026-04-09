"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Save, Printer, Monitor, Hash, Building2, MapPin, Laptop, BadgeCheck, ShieldAlert, CheckSquare, Power, Headphones, Briefcase, Maximize, Target, Key, Database, BookOpen, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { getAllocationById } from '@/services/allocationService';
import { getAssetById } from '@/services/assetService';
import { getEmployeeById } from '@/services/employeeService';
import toast from 'react-hot-toast';

export default function AssetIssueForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [formData, setFormData] = useState({
    userName: 'Loading...',
    dept: '-',
    location: '-',
    makeModel: '-',
    hostName: '-',
    monitorSerialNo: '-',
    serialNo: '-',
    accepted: false,
    accessories: {
      charger: true,
      wirelessMouse: false,
      headset: false,
      laptopBag: true,
      dockingStation: false,
    },
    monitors: {
      one: false,
      two: false,
    },
    groups: {
      deptDistributionGroup: false,
      securityGroup: false,
    },
    adminRecords: {
      inventoryUpdated: false,
      farEntry: false,
      putToUse: false,
    }
  });

  const [sysUserName, setSysUserName] = useState<string>('System User');

  useEffect(() => {
    const storedName = localStorage.getItem("user_name");
    if (storedName) setSysUserName(storedName);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const allocation = await getAllocationById(Number(id));

        // Fetch asset and employee for more details
        const [asset, employee] = await Promise.all([
          getAssetById(allocation.asset_id),
          getEmployeeById(allocation.employee_id)
        ]);

        setFormData(prev => ({
          ...prev,
          userName: employee.cn1 || allocation.employee_name || 'N/A',
          dept: employee.division || employee.business_unit || 'IT',
          location: employee.location || 'N/A',
          makeModel: `${asset.make || ''} ${asset.model || ''}`.trim() || 'Lenovo ThinkPad',
          hostName: asset.host_name || allocation.host_name || 'N/A',
          serialNo: asset.serial_num || 'N/A',
          monitorSerialNo: '-', // Not currently tracked in Asset model
        }));
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load allocation data");
      }
    }
    fetchData();
  }, [id]);

  const handleAccessoryChange = (name: keyof typeof formData.accessories) => {
    setFormData(prev => ({
      ...prev,
      accessories: { ...prev.accessories, [name]: !prev.accessories[name] }
    }));
  };

  const handleMonitorChange = (num: 'one' | 'two') => {
    setFormData(prev => ({
      ...prev,
      monitors: {
        one: num === 'one' ? !prev.monitors.one : false,
        two: num === 'two' ? !prev.monitors.two : false,
      }
    }));
  };

  const policies = [
    { title: "Data Privacy", text: "You are required to maintain strict confidentiality of all company and client data stored or accessed on the laptop. Any unauthorized sharing, copying, or disclosure of data is strictly prohibited." },
    { title: "Data Handling", text: "All data must be handled in accordance with company policies and relevant legal requirements. Sensitive information should be securely stored and disposed of as per IT guidelines." },
    { title: "System Ownership in Prospect of Department Shift or Change", text: "If you are transferred to another department or your role changes, the laptop and all associated assets must be returned to IT or reassigned as directed by the company. You are not permitted to retain possession of company-issued devices without proper authorization." },
    { title: "Breach of Trust", text: "Any misuse of the laptop or related resources, including actions that compromise security or company interests, will be considered a breach of trust and may result in disciplinary action." },
    { title: "Breach of Company Policy on Asset Handling", text: "Failure to comply with company policies regarding the handling, care, and return of issued assets may lead to penalties, including recovery of damages and further disciplinary proceedings." },
    { title: "Access Restriction", text: "Only authorized personnel should be allowed access to company-issued laptops and sensitive data. Strong passwords and multi-factor authentication should be used to safeguard information." },
    { title: "Use of Secure Networks", text: "Always connect to trusted and secure VPN networks when accessing or transmitting company data. Avoid using public or unsecured networks to reduce the risk of data breaches." },
    { title: "Regular Software Updates", text: "The company regularly pushes software and antivirus updates to ensure proper installation and safeguard against vulnerabilities and security threats." },
    { title: "Physical Security", text: "Do not leave the laptop unattended in public places or in unsecured locations. Always lock your device when not in use to prevent unauthorized physical access." },
    { title: "Restriction on Personal Use", text: "The laptop is to be used solely for official company purposes. You are not permitted to store personal data or use the device for personal activities of any kind." },
    { title: "Reporting Incidents", text: "Immediately report any suspected security incidents, loss, or theft of the laptop or data to the IT department to enable timely response and mitigation." },
    { title: "Consent for Data Review", text: "By using the company-issued laptop and emails, you grant full consent to the company and its IT representatives to access, review, and utilize any data stored on the device in cases of suspected misuse or during investigations, as deemed necessary by the company." }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Action Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Asset Acknowledgement</h1>
          <p className="text-slate-500 mt-1">Review policies, verify equipment, and sign the undertaking.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all font-medium shadow-sm"
          >
            <Printer size={18} />
            Print Form
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm shadow-blue-600/20">
            <Save size={18} />
            Save Record
          </button>
        </div>
      </div>

      {/* Main Document Body */}
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 text-slate-800 text-sm print:text-black">

        {/* Document Header */}
        <div className="flex justify-between items-start mb-10 pb-6 border-b border-slate-100 print:border-black print:pb-4">
          <div className="space-y-1">
            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs print:text-black">To,</p>
            <p className="text-xl font-bold text-slate-800 print:text-black">{formData.userName}</p>
            <div className="flex items-center gap-4 text-slate-600 mt-2 print:text-black font-medium">
              <span className="flex items-center gap-1.5"><Building2 size={16} className="print:hidden" /> {formData.dept}</span>
              <span className="flex items-center gap-1.5"><MapPin size={16} className="print:hidden" /> {formData.location}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs print:text-black">Date</p>
            <p className="font-bold text-slate-800 print:text-black">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-base font-bold text-slate-900 mb-6 print:text-black">
            Issue of Lenovo Laptop and Accessories for Official Use.
          </h2>
          <p className="text-slate-700 leading-relaxed print:text-black">
            Dear <strong>{formData.userName}</strong>, <br /><br />
            This is to inform you that the IT department is issuing the following Lenovo laptop and accessories
            to the <strong>{formData.dept}</strong> for official use. The responsibility for the laptop and its proper use is hereby assigned to you.
          </p>
        </div>

        {/* Equipment Details Card */}
        <div className="mb-10 p-6 rounded-2xl border border-slate-200 bg-slate-50 print:bg-transparent print:border-none print:p-0">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 print:text-black print:underline">Equipment Details</h3>
          <p className="font-medium text-slate-700 mb-4 print:text-black">The details of Laptop with accessories below:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 print:border-dotted print:border-slate-300">
              <span className="text-slate-500 font-medium print:text-black">System Make & Model:</span>
              <span className="font-bold print:text-black">{formData.makeModel}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 print:border-dotted print:border-slate-300">
              <span className="text-slate-500 font-medium print:text-black">Serial Number:</span>
              <span className="font-bold print:text-black">{formData.serialNo || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 print:border-dotted print:border-slate-300">
              <span className="text-slate-500 font-medium print:text-black">Host Name:</span>
              <span className="font-bold font-mono print:text-black">{formData.hostName || 'N/A'}</span>
            </div>
          </div>

          <h3 className="font-bold text-slate-800 mb-4 print:text-black">Accessories:</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors print:text-black">Laptop Charging Adapter with Power Cable</span>
              <input type="checkbox" checked={formData.accessories.charger} onChange={() => handleAccessoryChange('charger')} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer print:border-2" />
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors print:text-black">Wireless Mouse</span>
              <input type="checkbox" checked={formData.accessories.wirelessMouse} onChange={() => handleAccessoryChange('wirelessMouse')} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer print:border-2" />
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors print:text-black">Headset</span>
              <input type="checkbox" checked={formData.accessories.headset} onChange={() => handleAccessoryChange('headset')} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer print:border-2" />
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors print:text-black">Laptop Bag</span>
              <input type="checkbox" checked={formData.accessories.laptopBag} onChange={() => handleAccessoryChange('laptopBag')} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer print:border-2" />
            </label>


            <div className="flex items-center gap-3 pt-1">
              <span className="font-medium text-slate-700 print:text-black">Monitor</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="font-medium text-slate-700 print:text-black">1</span>
                  <input type="checkbox" checked={formData.monitors.one} onChange={() => handleMonitorChange('one')} className="w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer print:border-2" />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="font-medium text-slate-700 print:text-black">2</span>
                  <input type="checkbox" checked={formData.monitors.two} onChange={() => handleMonitorChange('two')} className="w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer print:border-2" />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 print:border-slate-300 print:border-dotted">
              <span className="font-bold text-slate-800 print:text-black block mb-3">Added in:</span>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors print:text-black">Dept. Distribution Group</span>
                  <input type="checkbox" checked={formData.groups.deptDistributionGroup} onChange={() => setFormData(p => ({ ...p, groups: { ...p.groups, deptDistributionGroup: !p.groups.deptDistributionGroup } }))} className="w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer print:border-2" />
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors print:text-black">Security Group</span>
                  <input type="checkbox" checked={formData.groups.securityGroup} onChange={() => setFormData(p => ({ ...p, groups: { ...p.groups, securityGroup: !p.groups.securityGroup } }))} className="w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer print:border-2" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Inventory Updates */}
        <div className="mb-12 flex flex-wrap items-center gap-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 print:bg-transparent print:border-none print:p-0">
          <label className="flex flex-wrap items-center gap-2 cursor-pointer">
            <span className="font-bold text-slate-800 print:text-black">Record updated in inventory</span>
            <input type="checkbox" checked={formData.adminRecords.inventoryUpdated} onChange={() => setFormData(p => ({ ...p, adminRecords: { ...p.adminRecords, inventoryUpdated: !p.adminRecords.inventoryUpdated } }))} className="w-5 h-5 rounded border-slate-300 text-emerald-600 cursor-pointer print:border-2" />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="font-bold text-slate-800 print:text-black">FAR Entry</span>
            <input type="checkbox" checked={formData.adminRecords.farEntry} onChange={() => setFormData(p => ({ ...p, adminRecords: { ...p.adminRecords, farEntry: !p.adminRecords.farEntry } }))} className="w-5 h-5 rounded border-slate-300 text-emerald-600 cursor-pointer print:border-2" />
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="font-bold text-slate-800 print:text-black">Put to Use Provided</span>
            <input type="checkbox" checked={formData.adminRecords.putToUse} onChange={() => setFormData(p => ({ ...p, adminRecords: { ...p.adminRecords, putToUse: !p.adminRecords.putToUse } }))} className="w-5 h-5 rounded border-slate-300 text-emerald-600 cursor-pointer print:border-2" />
          </label>
        </div>

        {/* Footer Signature Section - Swapped */}
        <div className="flex justify-between items-end mb-16 print:mb-24">
          <div>
            <p className="font-bold text-xl text-slate-800 mb-8 print:text-black">Assets Accepted By:</p>
            <div className="space-y-1">
              <p className="font-bold text-slate-800 print:text-black">{formData.userName}</p>
              <p className="font-medium text-slate-600 print:text-black">{formData.dept}</p>
              <p className="font-medium text-slate-600 print:text-black">{formData.location}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-xl text-slate-800 mb-8 print:text-black">Assets Allocated By:</p>
            <div className="space-y-1">
              <p className="font-bold text-slate-800 print:text-black">{sysUserName}</p>
              <p className="text-slate-600 font-medium print:text-black">IT</p>
              <p className="text-slate-600 font-medium print:text-black">Pune</p>
            </div>
          </div>
        </div>

        {/* Page Break for Print */}
        <div className="break-before-page border-t border-slate-300 pt-16 print:border-none print:pt-0"></div>

        {/* Policy Undertaking - Page 2 */}
        <div className="space-y-6 print:mt-12">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 print:bg-transparent print:border-none print:p-0">
            <p className="font-medium text-amber-900 print:text-black">You will ensure the safe usage and adherence to IT security policies during the usage of above said Laptop.</p>
            <p className="font-medium text-amber-900 mt-2 print:text-black">I request you to kindly read & accept the undertaking and return to IT.</p>
          </div>

          <ul className="space-y-4 pt-4 pl-4 pr-2 list-disc list-outside marker:text-slate-400 print:marker:text-black">
            {policies.map((policy, idx) => (
              <li key={idx} className="text-slate-700 print:text-black pl-2 leading-relaxed text-sm">
                <strong className="text-slate-900 print:text-black">{policy.title}:</strong> {policy.text}
              </li>
            ))}
          </ul>

          <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-2xl print:bg-transparent print:border-none print:p-0 print:mt-16">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={formData.accepted}
                onChange={() => setFormData(prev => ({ ...prev, accepted: !prev.accepted }))}
                className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer print:border-2"
              />
              <p className="font-medium text-slate-800 leading-relaxed print:text-black italic">
                I accept and agree to comply with all the policies, guidelines, and responsibilities outlined above regarding the use, handling, and security of the company-issued laptop and associated assets. I understand that any violation of these terms may result in disciplinary action.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-1">
                <div className="h-10 border-b border-slate-300 w-64 mb-4 print:border-black"></div>
                <p className="font-bold text-slate-800 print:text-black">{formData.userName}</p>
                <p className="font-medium text-slate-600 print:text-black">{formData.dept}</p>
                <p className="font-medium text-slate-600 print:text-black">{formData.location}</p>
                <p className="font-medium text-slate-600 print:text-black">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}