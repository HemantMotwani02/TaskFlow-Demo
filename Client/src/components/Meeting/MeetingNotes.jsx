import React, { useState } from 'react';

const MeetingNotes = ({ meetingId }) => {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);

  const handleAddNote = () => {
    // TODO: Integrate with backend API
    setNotes([...notes, { note, author: 'You' }]);
    setNote('');
  };

  return (
    <div className="p-4 border rounded shadow mt-4">
      <h2 className="text-lg font-bold mb-2">Meeting Notes</h2>
      <div className="mb-2">
        <input type="text" placeholder="Add note" value={note} onChange={e => setNote(e.target.value)} />
        <button onClick={handleAddNote} className="bg-green-500 text-white px-2 py-1 ml-2 rounded">Add</button>
      </div>
      <ul>
        {notes.map((n, idx) => (
          <li key={idx} className="mb-1">{n.author}: {n.note}</li>
        ))}
      </ul>
    </div>
  );
};

export default MeetingNotes;
