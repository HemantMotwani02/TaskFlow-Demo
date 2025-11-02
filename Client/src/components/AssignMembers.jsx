import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function AssignMembers({ onClose }) {
  const navigate = useNavigate();
  const { project_id } = useParams();
  const [remainingMemberData, setRemMemberData] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleCheckboxChange = (userId) => {
    setSelectedUsers(prevSelected => {
      if (prevSelected.includes(userId)) {
        return prevSelected.filter(id => id !== userId); // Uncheck the checkbox
      } else {
        return [...prevSelected, userId]; // Check the checkbox
      }
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (selectedUsers.length === 0) {
      alert('Please Select the members');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      for (const userId of selectedUsers) {
        const response = await fetch('/api/assignments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            projectId: parseInt(project_id),
            userId: parseInt(userId),
            role: 'developer'
          })
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Some Error Occurred, Please try again later. Thank You');
        }
      }

      alert(`Members Added Successfully.`);
      // Close the modal instead of navigating
      if (onClose) {
        onClose();
      } else {
        // Fallback to navigation if no onClose callback
        navigate(`/project/${project_id}`);
      }
    } catch (error) {
      alert(error.message);
      // Don't navigate on error, let user try again
    }
  };

  useEffect(() => {
    const getMembersByproject_idNotInvolved = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/projects/${project_id}/available-members`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setRemMemberData(data.data?.users || []);
        } else {
          console.error('Failed to fetch members:', data.message);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };
    getMembersByproject_idNotInvolved();
  }, [project_id]);

  return (
    <div>
      {
        remainingMemberData.length ? (
          <form style={{}} onSubmit={handleSubmit}>
            <div className="">
              <table className="table table-secondary table-hover" style={{ width: '50rem' }}>
                <thead>
                  <tr>
                    <th className="assign-member-table-head">EmpID</th>
                    <th className="assign-member-table-head">Employee Name</th>
                    <th className="assign-member-table-head">Projects on work</th>
                    <th className="assign-member-table-head">Select</th>
                  </tr>
                </thead>
                <tbody>
                  {remainingMemberData.map(user => (
                    <tr key={user.user_id}>
                      <td className="assign-member-table-head">{user.user_id}</td>
                      <td className="assign-member-table-head">{user.name}</td>
                      <td className="assign-member-table-head">{user.ct}</td>
                      <td className="assign-member-table-head">
                        <input
                          style={{ marginLeft: '20px', width: '20px', height: '20px' }}
                          type="checkbox"
                          value={user.user_id}
                          checked={selectedUsers.includes(user.user_id)} // Check if the user is selected
                          onChange={() => handleCheckboxChange(user.user_id)} // Pass userId to handleCheckboxChange
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <br />
            <button style={{}} className='button' type="submit">Assign</button>
          </form>
        ) : (
          <p>No data available or access denied</p>
        )
      }
    </div>
  );
}

export default AssignMembers;
