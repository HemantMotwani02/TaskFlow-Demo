import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToastContext } from "../../../contexts/ToastContext";
import { apiCall } from "../../../store";

const AddLogForm = ({ project_id, task_id, item, onClose }) => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToastContext();

  const [logdata, setLogData] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  // Debug: Log the received item data
  console.log('AddLogForm received item:', item);

  function handleLogData(event) {
    console.log('Input change - name:', event.target.name, 'value:', event.target.value);
    switch (event.target.name) {
      case 'log_data': 
        setLogData(event.target.value); 
        console.log('Set logdata to:', event.target.value);
        break;
      case 'log_StartTime': 
        setStartTime(event.target.value); 
        console.log('Set startTime to:', event.target.value);
        break;
      case 'log_EndTime': 
        setEndTime(event.target.value); 
        console.log('Set endTime to:', event.target.value);
        break;
      default: break;
    }
  }

  // Debug current state
  console.log('AddLogForm current state:', {
    logdata,
    startTime,
    endTime,
    task_id,
    project_id
  });

  const handleLogDataForm = async (e) => {
    e.preventDefault();
    console.log('=== FORM SUBMISSION STARTED ===');

    try {
      console.log('Form validation - logdata:', logdata);
      console.log('Form validation - startTime:', startTime);
      console.log('Form validation - endTime:', endTime);
      
      if (!logdata || logdata.trim() === '') {
        showError('Please enter log data', 'Validation Error');
        console.log('Validation failed - logdata is empty:', logdata);
        return;
      }
      
      // Validate time fields
      if (!startTime || startTime.trim() === '') {
        showError('Please select a start time', 'Validation Error');
        console.log('Validation failed - startTime is empty:', startTime);
        return;
      }
      
      if (!endTime || endTime.trim() === '') {
        showError('Please select an end time', 'Validation Error');
        console.log('Validation failed - endTime is empty:', endTime);
        return;
      }
      
      // Log the time values for debugging
      console.log('Time validation - startTime:', startTime, 'endTime:', endTime);
      console.log('Time types - startTime:', typeof startTime, 'endTime:', typeof endTime);

      // Calculate hours and minutes from start and end time
      // Ensure we add seconds to avoid Date parsing ambiguity
      const startWithSeconds = startTime.includes(':') && startTime.split(':').length === 2 ? startTime + ':00' : startTime;
      const endWithSeconds = endTime.includes(':') && endTime.split(':').length === 2 ? endTime + ':00' : endTime;
      
      const start = new Date(`2000-01-01T${startWithSeconds}`);
      const end = new Date(`2000-01-01T${endWithSeconds}`);
      const diffMs = end - start;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      // Use Math.round for minutes to avoid floating-point rounding errors
      const minutes = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      // Ensure time values are properly formatted (add seconds if not present)
      const formattedStartTime = startTime.includes(':') && startTime.split(':').length === 2 ? 
        startTime + ':00' : startTime;
        
      const formattedEndTime = endTime.includes(':') && endTime.split(':').length === 2 ? 
        endTime + ':00' : endTime;

      // Validate time format matches backend expectation (HH:MM:SS)
      const timeFormatRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!timeFormatRegex.test(formattedStartTime) || !timeFormatRegex.test(formattedEndTime)) {
        console.error('Invalid time format:', { formattedStartTime, formattedEndTime });
        showError('Invalid time format. Please select valid start and end times.', 'Validation Error');
        return;
      }

      const logData = {
        taskId: parseInt(task_id),
        projectId: parseInt(project_id),
        logdata: logdata,
        start_time: formattedStartTime,
        end_time: formattedEndTime
      };

      console.log('Form data being sent:', logData);
      console.log('startTime value:', startTime);
      console.log('endTime value:', endTime);
      console.log('formattedStartTime:', formattedStartTime);
      console.log('formattedEndTime:', formattedEndTime);

      // Final validation before API call
      if (!logData.start_time || !logData.end_time) {
        console.error('Missing required time fields:', logData);
        showError('Time fields are missing. Please try again.', 'Validation Error');
        return;
      }

      const token = localStorage.getItem('token');
      console.log('Making API request to /api/logs with data:', JSON.stringify(logData, null, 2));
      
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
        showError(`Server error (${response.status}): ${errorText}`, 'API Error');
        return;
      }

      const result = await apiCall('/logs', {
        method: 'POST',
        body: JSON.stringify(logData),
        meta: { successMessage: 'Log added successfully' }
      });
      console.log('API response:', result);

      if (result.success && result.data.success) {
        showSuccess('Log added successfully!', 'Success');
        // Instead of navigating away, close the form and let parent handle refresh
        if (onClose) {
          onClose();
        } else {
          // Fallback to navigation if no onClose callback
          navigate(`/project/${project_id}`);
        }
      } else {
        console.log('API returned error:', result);
        showError(result.error || result.data?.message || 'Failed to add log. Try again.', 'Error');
      }
    } catch (error) {
      console.error('Error adding log:', error);
      showError('An error occurred while adding the log. Please try again.', 'Network Error');
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <div className="addlog-form">
        <form onSubmit={handleLogDataForm} className="g-3" >
          <div className="col-md-10 mb-3">
            <label className="form-label"><b>Task Code </b></label>
            <div className="form-control" >{task_id}</div>
          </div>

          <div className="col-md-10 mb-3" >
            <label className="form-label"><b>Task Name </b></label>
            <div className="form-control" >{item.task_name || item.title || 'Unknown Task'}</div>
          </div>

          <div className="col-md-10 mb-3">
            <label className="form-label"><b>Task Desc </b> </label>
            <div className="form-control" >{item.task_details || item.description || 'No description available'}</div>
          </div>

          <div className="col-md-10 mb-3">
            <label className="form-label"><b>Created By </b> </label>
            <div className="form-control" >{item.userinfo?.name || item.creator?.name || item.createdBy?.name || 'Unknown'}</div>
          </div>

          <div className="col-md-10 mb-3">
            <label className="form-label"><b>Log Data</b></label>
            <input onChange={handleLogData} name="log_data" type="text" value={logdata} className="form-control" placeholder="Enter your log data" required />
          </div>

          <div className="col-md-10 mb-3">
            <label className="form-label"><b>Start Time</b></label>
            <input onChange={handleLogData} name="log_StartTime" type="time" value={startTime} className="form-control" required />
          </div>

          <div className="col-md-10 mb-3">
            <label className="form-label"><b>End Time</b></label>
            <input onChange={handleLogData} name="log_EndTime" type="time" value={endTime} className="form-control" required />
          </div>
          <div className="col-12 mt-3">
            <button type="button" onClick={() => {
              console.log('Current state values:');
              console.log('logdata:', logdata);
              console.log('startTime:', startTime);
              console.log('endTime:', endTime);
            }} className="btn btn-secondary me-2">Debug Values</button>
            <button type="submit" className="btn btn-primary">Add Log</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLogForm;