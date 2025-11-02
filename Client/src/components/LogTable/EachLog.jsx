import axios from "axios";
import { useNavigate } from "react-router-dom";
import roleUtils from '../../utils/roleUtils';
import { ROLES } from '../../store';
const localhost = 'http://localhost:7007';

const EachLog = ({ eachLog, parentFunction, item, project_id, task_id, flag,index }) => {
  const auth = roleUtils.getUserFromLocalStorage();
  const name = auth?.result?.name;
  const role = auth?.result?.role;

  const navigate = useNavigate();

  const handleBtnClicked = async (log_id, logstatus) => {
      try {
      console.log(log_id, logstatus)
      let response = await axios.post(`${localhost}/update-log-status`, {
        log_id: log_id,
        logstatus: logstatus
      }, {
        headers: {
          Authorization: `Bearer ${roleUtils.getTokenFromLocalStorage()}`
        }
      })

      let result = await response.data;
      if (result != null) {
        alert('status updated succesfully...')
        parentFunction()
      } else {
        alert('Some Error Occured')
        navigate('/');
      }

    } catch (error) {
      console.log(error);
      navigate('/');
    }
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{index}</td>
      <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">{item.task_name}</td>
      <td className="hidden md:table-cell px-3 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{item.task_details}</td>
      <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">{eachLog.logdata}</td>
      <td className="hidden sm:table-cell px-3 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{eachLog.created_at.split('T')[0]}</td>
      <td className="hidden lg:table-cell px-3 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{eachLog.userinfo.name}</td>
      <td className="px-3 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          eachLog.logstatus === 'approved' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : eachLog.logstatus === 'rejected'
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}>
          {eachLog.logstatus}
        </span>
      </td>

      {
        role === ROLES.DEVELOPER ? (
          eachLog.logstatus == 'pending' ? (
            <td className="hidden sm:table-cell px-3 py-3 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold">Updation Pending</td>
          ) : (
            <td className="hidden sm:table-cell px-3 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{eachLog.updated_at.split('T')[0]}</td>
          )
        ) : (
          eachLog.logstatus == 'pending' ? (
            <td className="px-3 py-3 whitespace-nowrap text-sm">
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => { handleBtnClicked(eachLog.log_id, "approved") }} 
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                >
                  Approve
                </button>
                <button 
                  onClick={() => { handleBtnClicked(eachLog.log_id, "rejected") }} 
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
                >
                  Reject
                </button>
              </div>
            </td>
          ) : (
            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">Checked</td>
          )
        )
      }
    </tr>
  )
}
export default EachLog;