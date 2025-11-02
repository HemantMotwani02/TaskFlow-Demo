import axios from "axios";
import { useEffect, useReducer, useState } from "react";
import roleUtils from '../../utils/roleUtils';
import { ROLES } from '../../store';
import { useNavigate } from "react-router-dom";
const localhost = 'http://localhost:7007';

function Projecttasks_rhs({ project_id }) {

    const auth = roleUtils.getUserFromLocalStorage();
    const name = auth?.result?.name;
    let role = auth?.result?.role;

    const navigate = useNavigate();
    const [taskdata, setTaskData] = useState();
    const [selectedValue, setSelectedValue] = useState();
    const [searchedTaskName, setSearchedTaskName] = useState();


    const handleTaskClick = (task_id) => {
        navigate(`/project/${project_id}/tasks/logs/${task_id}`)
    }

    useEffect(() => {
        const getTaskByPid = async () => {
            try {

                let response = await axios.get(`http://localhost:7007/project-details-task/${project_id}?val=${selectedValue}`, {
                    headers: {
                        Authorization: `Bearer ${auth.result.token}`
                    }
                })
                let result = await response.data;

                setTaskData(result.result[0]);
            } catch (error) {
                console.log(error);
            }
        }
        getTaskByPid();
    }, [selectedValue, ignored]);


    const handleChange = (e) => {
        setSelectedValue(e.target.value)
        console.log(selectedValue)
    }

    const parentFunction = () => {
        // Force re-render by updating a state variable
        setTaskData(prev => ({ ...prev, refresh: Date.now() }));
    }

    const HandleBtnClicked = async (task_id, status) => {
        try {
            let response = await axios.post(`${localhost}/update-task-status`, {
                task_id: task_id,
                status: status
            }, {
                headers: {
                    Authorization: `Bearer ${auth.result.token}`
                }
            })
            let result = await response.data;

            if (result.status = 'success') {
                alert('Task Updated Succesfully..');
                parentFunction();
            } else {
                alert('no data found, or please try again later.');
            }

        } catch (error) {
            console.log(error);
        }
    }

    const handleTaskName = (e) => {
        setSearchedTaskName(e.target.value)
    }

    const handleSearchForm = async (e) => {
        e.preventDefault()
        try {
            if (searchedTaskName == null || searchedTaskName == '') {
                alert('Please Search Something..');
            } else {
                let response = await axios.get(`http://localhost:7007/project-details-task/query/${project_id}?query=${searchedTaskName}`, {
                    headers: {
                        Authorization: `Bearer ${auth.result.token}`
                    }
                })
                let result = await response.data;
                console.log(result)
                setTaskData(result.result[0]);
            }

        } catch (error) {
            console.log(error)
            navigate('/');
        }
    }

    const handleAddLogEvent = async (project_id, task_id, item) => {
        try {
            localStorage.setItem('taskobj', JSON.stringify(item));
            navigate(`/project/${project_id}/task/${task_id}/add-log`);
        } catch (error) {
            console.log(error);
        }
    }


    return (
        <>
            <div style={{ display: "flex", flexDirection: 'column', justifyContent: "center", alignItems: 'center', width: "100%" }}>
                <h3 className="">Tasks</h3>
                <div>
                    <div className="d-flex  align-items-center justify-content-around" style={{ gap: '20px' }}>
                        <div className="d-flex gap-3" >
                            <h5>Filter by status</h5>
                            <select className="dropdown_p" value={selectedValue} onChange={handleChange}>
                                <option value="">All tasks</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                </div>
                {selectedValue && <p>Showing <b>{selectedValue}</b> tasks</p>}
                <div style={{ margin: 'auto', width: '60%', height: 'auto', marginBottom: '20px', marginTop: '20px' }}>
                    <form onSubmit={handleSearchForm} class="d-flex" style={{ height: '50px' }}>
                        <input onChange={handleTaskName} class="form-control me-2" type="text" placeholder="Search task by name" aria-label="Search" />
                        <button class="btn btn-outline-success" type="submit">Search</button>
                    </form>
                </div>
            </div>
            {
                taskdata ? <div className="taskDetails">

                    {

                        taskdata.tasks.map((item) => (
                            <ul className="list-group tul">
                                <li style={{ backgroundColor: '#212529' }} className="list-group-item active d-flex justify-content-between" aria-current="true">
                                    <div>
                                        <div><b>Task Name : </b>{item.task_name}</div>
                                        <div><b >STATUS</b> : {item.status.toUpperCase()}</div>
                                    </div>


                                    <div className="d-flex justify-content-center align-items-center" style={{ gap: '30px' }}>
                                        {item.status == 'pending' && role !== ROLES.DEVELOPER ?
                                            <button onClick={() => { HandleBtnClicked(item.task_id, 'completed') }} className="btn btn-success">Complete</button>
                                            : <></>}
                                        {role === ROLES.DEVELOPER ? <button onClick={() => { handleAddLogEvent(project_id, item.task_id, item) }} style={{ borderRadius: '5px', padding: '7px' }} className="btn btn-success">Add Log</button> : <></>}
                                        <p onClick={() => { handleTaskClick(item.task_id) }} id={item.task_id} className="link text-light ">View</p>
                                    </div>


                                </li>
                                <li className="task-card-items"><b>Task Description : </b>{item.task_details}</li>
                                <li className="task-card-items"><b>Created By : </b>{item.userinfo.name}</li>
                                <li className="task-card-items"><b>Created At : </b>{item.created_at.split('T')[0]}</li>
                            </ul>
                        ))
                    }

                </div> : <>no data found....</>
            }
        </>
    )
}
export default Projecttasks_rhs;