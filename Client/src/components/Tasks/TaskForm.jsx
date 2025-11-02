import { useState, useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useTaskStore, useUserStore, useProjectStore } from "../../store";
import { useToastContext } from "../../contexts/ToastContext";

function TaskForm() {
  const navigate = useNavigate();
  const { project_id } = useParams();
  const { createTask, isLoading, error } = useTaskStore();
  const { users, fetchUsers } = useUserStore();
  const { projects, fetchProjects } = useProjectStore();
  const { showSuccess, showError } = useToastContext();

  //task details
  const [taskName, setTaskName] = useState('');
  const [taskDetails, setTaskDesc] = useState('');
  const [estimateTime, setEstimateTime] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Get current project and its members
  const currentProject = projects.find(p => {
    const pId = p.id || p.project_id || p.manager_id || p.created_by;
    return pId == project_id;
  });
  
  const projectMembers = currentProject?.assignments?.map(assignment => assignment.user).filter(user => user?.role === 'developer') || [];

  useEffect(() => {
    fetchProjects(); // Fetch projects to get project members
  }, [fetchProjects]);

  function handleTaskDetails(event) {
    switch (event.target.name) {
      case 'task_name': setTaskName(event.target.value); break;
      case 'task_description': setTaskDesc(event.target.value); break;
      case 'estimate_time': setEstimateTime(event.target.value); break;
      case 'assigned_to': setAssignedTo(event.target.value); break;
      default: break;
    }
  }

  const handleTaskForm = async (e) => {
    e.preventDefault();
    
    try {
      if (taskName === '' || taskDetails === '') {
        showError("Please fill all required fields");
        return;
      }

      const taskData = {
        title: taskName,
        description: taskDetails,
        projectId: parseInt(project_id),
        estimate_time: estimateTime,
        status: 'pending',
        priority: 'medium',
        assigned_to: assignedTo ? parseInt(assignedTo) : null
      };

      const result = await createTask(project_id, taskData);

      if (result.success) {
        showSuccess('Task created successfully!');
        // Navigate back to project details instead of tasks page
        navigate(`/project/${project_id}`);
      } else {
        showError(result.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      showError('An error occurred while creating the task');
    }
  };

  return (
    <>
      <p className="link" onClick={() => navigate(-1)}>Back</p>
      <div className="MainDiv-for-single-functionality p-3">
        {
          project_id ? <>
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}><h1 className="">Create a Task</h1></div>
            <div id="taskbox" className="login-box bg-dark text-light">

              <form onSubmit={handleTaskForm}>
                <div className="user-box">
                  <label>Task Name</label>
                  <input onChange={handleTaskDetails} type="text" name="task_name" required />
                </div>

                <div className="user-box">
                  <label>Task Description</label>
                  <input onChange={handleTaskDetails} type="text" name="task_description" required/>
                </div>

                <div className="user-box">
                  <label>Estimate Time (in hrs)</label>
                  <input onChange={handleTaskDetails} type="time" name="estimate_time" />
                </div>

                <div className="user-box">
                  <label>Assign to Developer (Optional)</label>
                  <select onChange={handleTaskDetails} name="assigned_to" value={assignedTo}>
                    <option value="">Unassigned</option>
                    {projectMembers.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Submit'}
                </button>
              </form>
            </div>
          </> : <div>loading...</div>
        }
      </div>
    </>
  );
}

export default TaskForm;