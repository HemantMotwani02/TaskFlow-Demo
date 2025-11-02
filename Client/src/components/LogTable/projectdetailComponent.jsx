import axios from "axios";
import { useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogTableComponent from "./logTableComponent";
import roleUtils from '../../utils/roleUtils';
import { ROLES } from '../../store';


const ProjectDetailComponent = ({ project_id }) => {
  const auth = roleUtils.getUserFromLocalStorage();
  const name = auth?.result?.name;
  const role = auth?.result?.role;

  const navigate = useNavigate();
  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

  function parentFunction() {
    console.log('hey in parent');
    forceUpdate();
  }

  const [logdata, setlogData] = useState();

  useEffect(() => {
    const fetchLogdata = async () => {
      try {
        const logResponse = await axios.get(`http://localhost:7007/project-details-log/${project_id}`)
        setlogData(await logResponse.data.result[0]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchLogdata();
  }, []);


  // function TaskCount()
  // {
  //   return 'Logdata',logdata.tasks.length;
  // }

  const HandleLogStatus = async (log_id, project_id, str) => {
    parentFunction()
    try {
      let response = await axios.get(`http://localhost:8000/update/log/${log_id}?wtd=${str}`);
      console.log(response.data);
      navigate(`/project/${project_id}`);
    } catch (error) {
      console.error('Error updating log status:', error);
      // Handle error gracefully, if needed
    }
  };

  const handleViewLogDetails = (e) => {
    navigate(`/project/${project_id}/tasks/logs/0`)
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Recent Logs</h2>
        <h5 
          onClick={handleViewLogDetails} 
          className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
        >
          View logs in detail
        </h5>
      </div>
      {
        logdata ? (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Task</th>
                  <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Task Desc</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Log Data</th>
                  <th className="hidden sm:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Log Date</th>
                  <th className="hidden lg:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Log By</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  {role === ROLES.DEVELOPER ? (
                    <th className="hidden sm:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Updated</th>
                  ) : (
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Options</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {logdata.tasks.map((task) => (
                  <LogTableComponent key={task.task_id} item={task} parentFunction={parentFunction} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        )
      }
    </div>
  )
}

export default ProjectDetailComponent;