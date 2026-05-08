import React, { useState } from 'react';

const MeetingScheduler = () => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('in-person');
  const [date, setDate] = useState('');
  const [participants, setParticipants] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Integrate with backend API
    alert(`Meeting scheduled: ${title}, ${type}, ${date}, ${participants}`);
  };

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-lg font-bold mb-2">Schedule Meeting</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="in-person">In Person</option>
          <option value="online">Online</option>
        </select>
        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
        <input type="text" placeholder="Participants (comma separated IDs)" value={participants} onChange={e => setParticipants(e.target.value)} required />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Schedule</button>
      </form>
    </div>
  );
};

export default MeetingScheduler;
