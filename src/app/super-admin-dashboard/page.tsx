// app/super-admin-dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { 
  FaUserShield, 
  FaUsers, 
  FaKey, 
  FaSignOutAlt, 
  FaUserPlus,
  FaEye,
  FaEyeSlash,
  FaChartBar,
  FaTrash,
  FaEdit,
  FaLock,
  FaCheckCircle,
  FaTimesCircle,
  FaEnvelope,
  FaRoute
} from 'react-icons/fa';
import ManageRoutes from '@/components/admin/ManageRoutes';
import AssignRoutes from '@/components/admin/AssignRoutes';

interface Admin {
  _id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admins' | 'routes' | 'assignRoutes' | 'changePassword'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [adminStats, setAdminStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Create Admin States
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    password: ''
  });
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Change Admin Password States
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminChangeModal, setShowAdminChangeModal] = useState(false);
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);

  // User Info
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    role: ''
  });

  // Fetch current user info
  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/me', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }, []);

  // Fetch admins list
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/admins`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
        
        // Calculate stats
        const total = data.admins?.length || 0;
        const active = data.admins?.filter((admin: Admin) => admin.isActive)?.length || 0;
        setAdminStats({ 
          total, 
          active, 
          inactive: total - active 
        });
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load admins list',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserInfo();
    if (activeTab === 'admins') {
      fetchAdmins();
    }
  }, [activeTab, fetchUserInfo, fetchAdmins]);

  // ========== CREATE ADMIN ==========
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdmin.username || !newAdmin.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill all fields',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    if (newAdmin.password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Password must be at least 6 characters',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/create-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newAdmin)
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Admin Created',
          html: `
            <div class="text-left">
              <p>✅ Admin created successfully!</p>
              <div class="mt-3 p-3 bg-gray-50 rounded-lg">
                <p class="font-semibold">Credentials:</p>
                <p class="mt-1">Username: <span class="font-mono">${newAdmin.username}</span></p>
                <p>Password: <span class="font-mono">${newAdmin.password}</span></p>
              </div>
              <p class="mt-2 text-sm text-gray-600">
                Save these credentials securely.
              </p>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc2626',
          width: 450
        });

        // Reset form and close modal
        setNewAdmin({ username: '', password: '' });
        setShowCreateModal(false);
        fetchAdmins();
      } else {
        throw new Error(data.error || 'Failed to create admin');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== CHANGE OWN PASSWORD ==========
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ( !newPassword || !confirmPassword) {
      Swal.fire('Error', 'Please fill all fields', 'error');
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire('Error', 'Password must be at least 6 characters', 'error');
      return;
    }

    // if (newPassword !== confirmPassword) {
    //   Swal.fire('Error', 'Passwords do not match', 'error');
    //   return;
    // }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Check Your Email',
          html: `
            <div class="text-left">
              <p>✅ Verification email sent to:</p>
              <p class="font-bold text-red-500 mt-1">${userInfo.email}</p>
              <p class="mt-2 text-gray-600">
                Click the link in the email to complete password change.
              </p>
              <p class="text-sm text-gray-500 mt-2">
                Link expires in 15 minutes.
              </p>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc2626',
          width: 450
        });

        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data.error || 'Failed to send verification email');
      }
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ========== CHANGE ADMIN PASSWORD ==========
  const handleAdminPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAdmin || !adminNewPassword) {
      Swal.fire('Error', 'Please enter new password', 'error');
      return;
    }

    if (adminNewPassword.length < 6) {
      Swal.fire('Error', 'Password must be at least 6 characters', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/change-admin-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          adminId: selectedAdmin._id,
          newPassword: adminNewPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Password Changed',
          html: `
            <div class="text-left">
              <p>✅ Admin password changed successfully!</p>
              <div class="mt-3 p-3 bg-gray-50 rounded-lg">
                <p class="font-semibold">For: <span class="font-mono">${selectedAdmin.username}</span></p>
                <p class="mt-1">New Password: <span class="font-mono">${adminNewPassword}</span></p>
              </div>
              <p class="mt-2 text-sm text-gray-600">
                Share this password with the admin.
              </p>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc2626',
          width: 450
        });

        // Reset form and close modal
        setSelectedAdmin(null);
        setAdminNewPassword('');
        setShowAdminChangeModal(false);
      } else {
        throw new Error(data.error || 'Failed to change admin password');
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== DELETE ADMIN ==========
  const handleDeleteAdmin = async (adminId: string, username: string) => {
    const result = await Swal.fire({
      title: 'Delete Admin?',
      html: `
        <div class="text-left">
          <p class="text-red-600 font-semibold">Are you sure you want to delete this admin?</p>
          <p class="mt-2">Admin: <span class="font-mono">${username}</span></p>
          <p class="text-sm text-gray-600 mt-2">
            This action cannot be undone.
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/delete-admin/${adminId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Admin has been deleted successfully',
            confirmButtonColor: '#dc2626',
          });
          fetchAdmins();
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete admin');
        }
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message,
          confirmButtonColor: '#dc2626',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // ========== LOGOUT ==========
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, logout!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/admin/logout`, {
          method: 'POST',
          credentials: 'include'
        });

        Swal.fire({
          icon: 'success',
          title: 'Logged Out',
          text: 'You have been successfully logged out',
          timer: 1500,
          showConfirmButton: false
        });

        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } catch (error) {
        console.error('Logout error:', error);
        router.push('/login');
      }
    }
  };

  // ========== FORMAT DATE ==========
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ========== STATS CARDS ==========
  const StatsCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className=" mx-auto xl:mx-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="p-2 bg-red-50 rounded-lg">
                  <FaUserShield className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">Super Admin Dashboard</h1>
                  <p className="text-sm text-gray-500">
                    Welcome, <span className="font-semibold text-red-500">{userInfo.username}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center ">
          
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-sm"
              >
                <FaSignOutAlt className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
      

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <nav className="space-y-2 p-4">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                    activeTab === 'dashboard'
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FaChartBar className="mr-3 h-5 w-5" />
                  Dashboard
                </button>
                
                <button
                  onClick={() => setActiveTab('admins')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                    activeTab === 'admins'
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FaUsers className="mr-3 h-5 w-5" />
                  Manage Admins
                  {adminStats.total > 0 && (
                    <span className="ml-auto bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
                      {adminStats.total}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab('changePassword')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                    activeTab === 'changePassword'
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FaLock className="mr-3 h-5 w-5" />
                  Change Password
                </button>

                 <button
                  onClick={() => setActiveTab('routes')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                    activeTab === 'routes'
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FaRoute className="mr-3 h-5 w-5" />
                  Manage Routes
                </button>
                
                <button
                  onClick={() => setActiveTab('assignRoutes')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                    activeTab === 'assignRoutes'
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FaUserShield className="mr-3 h-5 w-5" />
                  Assign Routes
                </button>
              </nav>
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900 truncate">{userInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {userInfo.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border border-red-100">
                      {/* <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Welcome to Super Admin Panel
                      </h3> */}
                      {/* <p className="text-gray-600 mb-4">
                        Manage your admin accounts, reset passwords, and control system access from this dashboard.
                      </p> */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setActiveTab('admins')}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-sm flex items-center"
                        >
                          <FaUserPlus className="mr-2 h-4 w-4" />
                          Manage Admins
                        </button>
                        <button
                          onClick={() => setActiveTab('changePassword')}
                          className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition flex items-center"
                        >
                          <FaKey className="mr-2 h-4 w-4" />
                          Change Password
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="p-4 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-sm transition text-left"
                        >
                          <FaUserPlus className="h-5 w-5 text-red-500 mb-2" />
                          <p className="font-medium text-gray-900">Create New Admin</p>
                          <p className="text-sm text-gray-600 mt-1">Add new admin accounts</p>
                        </button>
                        <button
                          onClick={() => setActiveTab('changePassword')}
                          className="p-4 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-sm transition text-left"
                        >
                          <FaLock className="h-5 w-5 text-red-500 mb-2" />
                          <p className="font-medium text-gray-900">Change Password</p>
                          <p className="text-sm text-gray-600 mt-1">Update your security</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admins Tab */}
            {activeTab === 'admins' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-sm flex items-center"
                    >
                      <FaUserPlus className="mr-2 h-4 w-4" />
                      Create Admin
                    </button>
                  </div>

                  {/* Admins Table */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading admins...</p>
                      </div>
                    ) : admins.length === 0 ? (
                      <div className="text-center py-12">
                        <FaUsers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No admins found</p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          Create Your First Admin
                        </button>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Admin
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {admins.map((admin) => (
                            <tr key={admin._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                                      <FaUserShield className="h-4 w-4 text-red-500" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{admin.username}</div>
                                      <div className="text-sm text-gray-500">{admin.email}</div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  admin.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {admin.isActive ? (
                                    <>
                                      <FaCheckCircle className="mr-1 h-3 w-3" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <FaTimesCircle className="mr-1 h-3 w-3" />
                                      Inactive
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(admin.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedAdmin(admin);
                                      setShowAdminChangeModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                    title="Change Password"
                                  >
                                    <FaKey className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAdmin(admin._id, admin.username)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                    title="Delete Admin"
                                  >
                                    <FaTrash className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'changePassword' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Your Password</h2>
                  
                  <form onSubmit={handleChangePassword} className=" space-y-6">
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div> */}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                          placeholder="Enter new password (min 6 characters)"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                          placeholder="Confirm new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-4 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Sending Verification...
                        </>
                      ) : (
                        'Send Verification Email'
                      )}
                    </button>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">Note:</span> A verification email will be sent to your registered email address. You must click the link in the email to complete the password change.
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'routes' && <ManageRoutes />}
            
            {activeTab === 'assignRoutes' && <AssignRoutes />}
          </div>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Create New Admin</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewAdmin({ username: '', password: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                  placeholder="Enter admin username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition pr-10"
                    placeholder="Enter temporary password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showAdminPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAdmin({ username: '', password: '' });
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Admin Password Modal */}
      {showAdminChangeModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Change Admin Password</h3>
              <button
                onClick={() => {
                  setShowAdminChangeModal(false);
                  setSelectedAdmin(null);
                  setAdminNewPassword('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Changing password for:</p>
              <p className="font-medium text-gray-900">{selectedAdmin.username}</p>
            </div>

            <form onSubmit={handleAdminPasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showAdminNewPassword ? "text" : "password"}
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition pr-10"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showAdminNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminChangeModal(false);
                    setSelectedAdmin(null);
                    setAdminNewPassword('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}