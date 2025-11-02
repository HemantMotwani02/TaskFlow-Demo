import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AddLogForm from "./AddLogForm";

const AddLog = () => {
  const { project_id, task_id } = useParams();
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('AddLog component - URL params:', { project_id, task_id });

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setLoading(true);
        
        // First try to get from localStorage
        let taskobj = localStorage.getItem('taskobj');
        console.log('localStorage taskobj:', taskobj);
        if (taskobj) {
          try {
            const parsedTask = JSON.parse(taskobj);
            console.log('Parsed task from localStorage:', parsedTask);
            setTaskData(parsedTask);
            setLoading(false);
            return;
          } catch (parseError) {
            console.warn('Failed to parse taskobj from localStorage:', parseError);
          }
        } else {
          console.log('No taskobj found in localStorage');
        }

        // If localStorage fails, fetch from API
        const token = localStorage.getItem('token');
        console.log('Fetching task data from API for task_id:', task_id);
        const response = await fetch(`/api/tasks/${task_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('API response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('API response data:', result);
          if (result.success && result.data) {
            setTaskData(result.data);
            console.log('Task data set:', result.data);
          } else {
            console.error('API returned success=false or no data:', result);
            setError('Task not found');
          }
        } else {
          const errorText = await response.text();
          console.error('API request failed:', response.status, errorText);
          setError('Failed to fetch task data');
        }
      } catch (error) {
        console.error('Error fetching task data:', error);
        setError('Error loading task data');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskData();
  }, [task_id]);

  if (loading) {
    return (
      <div className="MainDiv p-3">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-3">Loading task data...</span>
        </div>
      </div>
    );
  }

  if (error || !taskData) {
    return (
      <div className="MainDiv p-3">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error || 'Task data not available'}</p>
          <hr />
          <button 
            className="btn btn-outline-danger" 
            onClick={() => navigate(`/project/${project_id}`)}
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  console.log('AddLog rendering with taskData:', taskData);
  
  return (
    <>
      <div className="MainDiv p-3">
        <AddLogForm 
          project_id={project_id} 
          task_id={task_id} 
          item={taskData} 
          onClose={() => navigate(`/project/${project_id}`)}
        />
      </div>
    </>
  )
}
export default AddLog;