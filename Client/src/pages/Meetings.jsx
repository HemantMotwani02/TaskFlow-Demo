import React, { useState } from 'react';
import { useAuthStore, ROLES } from '../store';
import ScheduleCalendar from '../components/Meeting/ScheduleCalendar';
import MeetingNotes from '../components/Meeting/MeetingNotes';
import { useUserStore } from '../store';
import toastService from '../utils/toastService';
import { fetchMeetings, createMeeting, updateMeeting, deleteMeeting, updateMeetingStatus } from '../utils/meetingApi';
import MultiUserMeetingRoom from '../components/Meeting/MultiUserMeetingRoom';

const Meetings = () => {
  // Default to today's date
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('in-person');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const { users, fetchUsers } = useUserStore();
  const [meetings, setMeetings] = useState([]);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showRoom, setShowRoom] = useState(false);
  const [roomMeeting, setRoomMeeting] = useState(null);
  
  // Load meetings from backend on mount
  React.useEffect(() => {
    fetchMeetings().then(data => {
      // Handle both old and new API response formats
      if (data && Array.isArray(data)) {
        setMeetings(data);
      } else if (data && data.data && Array.isArray(data.data)) {
        setMeetings(data.data);
      } else {
        setMeetings([]);
      }
    }).catch(() => setMeetings([]));
  }, []);
  const { user, canAccess } = useAuthStore();
  // Only fetch all users if admin/manager - employees don't need full user list
  React.useEffect(() => { 
    if (canAccess([ROLES.ADMIN, ROLES.MANAGER])) {
      fetchUsers(1, 50, {}); 
    }
  }, [fetchUsers, canAccess]);

  // Refetch meetings when user is available (ensures auth header present)
  React.useEffect(() => {
    if (!user || !user.user_id) return;
    fetchMeetings().then(data => {
      if (Array.isArray(data)) setMeetings(data); else if (Array.isArray(data?.data)) setMeetings(data.data); else setMeetings([]);
    }).catch(() => {});
  }, [user?.user_id]);

  // Only allow scheduling for admin/manager - just set the date, don't open form
  const handleDateClick = (date) => {
    setSelectedDate(date);
    // Removed: Don't automatically open form on date click
    // Admin/Manager will use "Schedule New Meeting" button instead
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    setTitle(meeting.title || '');
    setType(meeting.type || 'in-person');
    setStartTime(meeting.startTime || meeting.start_time || '');
    setEndTime(meeting.endTime || meeting.end_time || '');
    setSelectedUsers(meeting.participants || []);
    setShowForm(true);
  };

  const handleDeleteMeeting = async (meeting) => {
    if (!window.confirm(`Are you sure you want to delete the meeting "${meeting.title}"?`)) {
      return;
    }
    
    try {
      const targetId = meeting.meeting_id || meeting.id;
      await deleteMeeting(targetId);
      setMeetings(prev => prev.filter(m => (m.meeting_id || m.id) !== targetId));
      toastService.showSuccess('Meeting deleted successfully!', 'Meeting');
    } catch (error) {
      toastService.showError('Failed to delete meeting.', 'Error');
    }
  };

  const openRoom = (meeting) => {
    setRoomMeeting(meeting);
    setShowRoom(true);
  };

  const handleStartMeeting = async (meeting) => {
    try {
      const targetId = meeting.meeting_id || meeting.id;
      const updated = await updateMeetingStatus(targetId, 'started');
      const updatedMeeting = { ...meeting, ...(updated || {}), status: 'started' };
      setMeetings(prev => prev.map(m => (m.meeting_id || m.id) === targetId ? updatedMeeting : m));
      openRoom(updatedMeeting);
    } catch (e) {
      toastService.showError('Failed to start meeting.', 'Error');
    }
  };

  const handleJoinMeeting = (meeting) => {
    openRoom(meeting);
  };

  const handleChangeStatus = async (meeting, nextStatus) => {
    try {
      const targetId = meeting.meeting_id || meeting.id;
      const updated = await updateMeetingStatus(targetId, nextStatus);
      setMeetings(prev => prev.map(m => (m.meeting_id || m.id) === targetId ? { ...m, ...(updated || {}), status: nextStatus } : m));
      toastService.showSuccess(`Status changed to ${nextStatus}`, 'Meeting');
    } catch (e) {
      toastService.showError('Failed to change meeting status.', 'Error');
    }
  };

  const handleUserCheck = (userId) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  // Optimistic user search
  const filteredUsers = userSearch
    ? users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
    : users.slice(0, 50); // Show only first 50 users if no search

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation
    if (!title.trim()) {
      toastService.showError('Meeting name is required.', 'Validation Error');
      return;
    }
    if (!selectedDate) {
      toastService.showError('Meeting date is required.', 'Validation Error');
      return;
    }
    if (!startTime || !endTime) {
      toastService.showError('Meeting start and end time are required.', 'Validation Error');
      return;
    }
    if (selectedUsers.length === 0) {
      toastService.showError('Please select at least one employee.', 'Validation Error');
      return;
    }
    // Prevent scheduling on past date/time
    const now = new Date();
    // Use local date parsing to avoid timezone issues
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = startTime.split(':').map(Number);
    const meetingDate = new Date(year, month - 1, day, hours, minutes);
    if (meetingDate < now) {
      toastService.showError('Cannot schedule a meeting in the past.', 'Validation Error');
      return;
    }
    try {
      let result;
      if (editingMeeting) {
        // Update existing meeting
        const targetId = editingMeeting.meeting_id || editingMeeting.id;
        result = await updateMeeting(targetId, {
          title,
          type,
          scheduledAt: selectedDate,
          startTime,
          endTime,
          participants: selectedUsers
        });
        setMeetings(prev => prev.map(m => (m.meeting_id || m.id) === targetId ? { ...m, ...result } : m));
        toastService.showSuccess('Meeting updated successfully!', 'Meeting');
      } else {
        // Create new meeting
        result = await createMeeting({
          title,
          type,
          scheduledAt: selectedDate,
          startTime,
          endTime,
          participants: selectedUsers
        });
        setMeetings(prev => [...prev, result]);
        toastService.showSuccess('Meeting scheduled successfully!', 'Meeting');
      }
      
      // Send notifications to participants
      selectedUsers.forEach(uid => {
        toastService.showInfo(`User ${uid} notified about meeting.`, 'Notification');
      });
      
      // Reset form
      setShowForm(false);
      setEditingMeeting(null);
      setTitle('');
      setType('in-person');
      setStartTime('');
      setEndTime('');
      setSelectedUsers([]);
    } catch (error) {
      toastService.showError(editingMeeting ? 'Failed to update meeting.' : 'Failed to schedule meeting.', 'Error');
    }
  };

  // Filter meetings for employees: only show meetings where user is a participant
  const filteredMeetings = React.useMemo(() => {
    const role = String(user.role || '').toLowerCase();
    if (['admin','manager'].includes(role)) return meetings;
    const userIdStr = String(user.user_id);
    return meetings.filter(m => (m.participants || []).some(pid => String(pid) === userIdStr));
  }, [meetings, user]);

  // Helper: meetings for selected date
  const meetingsForSelectedDate = React.useMemo(() => {
    if (!selectedDate) return [];
    return filteredMeetings.filter(m => {
      // Handle both scheduledAt and scheduled_at field names
      if (m?.scheduledAt && m.scheduledAt.length === 10) {
        return m.scheduledAt === selectedDate;
      }
      const sched = String(m.scheduledAt || m.scheduled_at || '').split('T')[0];
      return sched === selectedDate || m.scheduledAt === selectedDate || m.scheduled_at === selectedDate;
    });
  }, [filteredMeetings, selectedDate]);

  return (
    <div className="w-full h-full flex flex-col" style={{minHeight: 'calc(100vh - 64px)'}}>
      <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 p-2 sm:p-4 overflow-hidden">
        {/* Calendar section - responsive width */}
        <div className="flex-1 lg:w-2/3 min-h-[350px] sm:min-h-[400px] lg:min-h-0">
          <ScheduleCalendar onDateClick={handleDateClick} meetings={filteredMeetings} />
        </div>
        
        {/* Meeting details panel - responsive width with better mobile support */}
        <div className="w-full lg:w-1/3">
          <div className="border rounded-lg p-3 sm:p-4 bg-white dark:bg-gray-900 shadow h-full max-h-[500px] sm:max-h-[600px] lg:max-h-none lg:sticky lg:top-4 overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Selected Date</h3>
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full self-start">{selectedDate}</span>
            </div>
            
            {selectedDate && (
              <div className="space-y-4">
                {/* Action buttons for managers/admins */}
                {[ROLES.ADMIN, ROLES.MANAGER].includes(user.role) && selectedDate && (
                  <button
                    onClick={() => {
                      setEditingMeeting(null);
                      setShowForm(true);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Schedule New Meeting
                  </button>
                )}
                
                {/* Meeting list */}
                {meetingsForSelectedDate.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="text-3xl sm:text-4xl mb-3">📅</div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                      No meetings scheduled for this date.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Scheduled Meetings
                      </h4>
                      <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        {meetingsForSelectedDate.length}
                      </span>
                    </div>
                    <ul className="space-y-2 sm:space-y-3">
                      {meetingsForSelectedDate.map((m, idx) => (
                        <li key={m.id || m.meeting_id || idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex flex-col gap-2 sm:gap-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base">{m.title || 'Meeting'}</div>
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                                  <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                                    m.type === 'online' 
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                  }`}>
                                    {m.type === 'online' ? '🌐 Online' : '🏢 In-Person'}
                                  </span>
                                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">
                                    ⏰ {m.startTime || m.start_time || '--:--'} - {m.endTime || m.end_time || '--:--'}
                                  </span>
                                </div>
                                {Array.isArray(m.participants) && (
                                  <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 flex items-center gap-1">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                    </svg>
                                    {m.participants.length} participant{m.participants.length !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Action buttons row */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              {/* Admin/Manager actions */}
                              {[ROLES.ADMIN, ROLES.MANAGER].includes(user.role) && (
                                <>
                                  <button
                                    onClick={() => handleEditMeeting(m)}
                                    className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                    title="Edit meeting"
                                  >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span className="hidden xs:inline">Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMeeting(m)}
                                    className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-[10px] sm:text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                    title="Delete meeting"
                                  >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span className="hidden xs:inline">Delete</span>
                                  </button>
                                  {/* Start/Rejoin button for online meetings (organizer) */}
                                  {(m.type === 'online') && (m.organizer_id === user.user_id) && (
                                    m.status === 'scheduled' ? (
                                      <button
                                        onClick={() => handleStartMeeting(m)}
                                        className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] sm:text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                                      >
                                        ▶️ Start
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleJoinMeeting(m)}
                                        className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] sm:text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                                      >
                                        🔄 Rejoin
                                      </button>
                                    )
                                  )}
                                </>
                              )}
                              {/* Join button for participants (non-organizer) */}
                              {m.type === 'online' && m.organizer_id !== user.user_id && (
                                m.status === 'started' ? (
                                  <button
                                    onClick={() => handleJoinMeeting(m)}
                                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] sm:text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                                  >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                    </svg>
                                    <span className="hidden xs:inline">Join</span>
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-[10px] sm:text-xs font-medium cursor-not-allowed flex items-center justify-center gap-1"
                                    title="Waiting for organizer to start the meeting"
                                  >
                                    ⏳ Waiting...
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {showForm && [ROLES.ADMIN, ROLES.MANAGER].includes(user.role) && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              {editingMeeting ? 'Edit Meeting' : 'Schedule Meeting'} for <span className="text-blue-600 dark:text-blue-400">{selectedDate}</span>
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required className="px-4 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              <select value={type} onChange={e => setType(e.target.value)} className="px-4 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value="in-person">In Person</option>
                <option value="online">Online</option>
              </select>
              <div className="flex gap-2">
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="px-4 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-1/2" placeholder="Start Time" />
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="px-4 py-2 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-1/2" placeholder="End Time" />
              </div>
              <div>
                <div className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Select Participants:</div>
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="mb-2 px-3 py-2 rounded border w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-800">
                  {filteredUsers.length === 0 && <div className="text-gray-500 dark:text-gray-400">No users found.</div>}
                  {filteredUsers.map(u => (
                    <label key={u.user_id} className="block cursor-pointer py-1 px-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.user_id)}
                        onChange={() => handleUserCheck(u.user_id)}
                        className="mr-2"
                      />
                      <span className="ml-2 text-gray-900 dark:text-gray-100">{u.name} <span className="text-xs text-gray-500 dark:text-gray-400">({u.email})</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow">
                {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
              </button>
              <button 
                type="button" 
                className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-6 py-2 rounded-lg font-semibold shadow" 
                onClick={() => {
                  setShowForm(false);
                  setEditingMeeting(null);
                  setTitle('');
                  setType('in-person');
                  setStartTime('');
                  setEndTime('');
                  setSelectedUsers([]);
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Meeting Room Overlay - Fullscreen */}
      {showRoom && roomMeeting && (
        <MultiUserMeetingRoom 
          meeting={roomMeeting} 
          currentUser={user} 
          onRequestClose={() => { setShowRoom(false); setRoomMeeting(null); }}
        />
      )}
    </div>
  );
};

export default Meetings;
