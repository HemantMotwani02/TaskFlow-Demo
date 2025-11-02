import { useNavigate } from 'react-router-dom';

function HandleCardData(props) {
    const navigate = useNavigate();
    const projects = props.item; // Now it's an array of projects from the store
    console.log('Projects data:', projects);

    const HandleCardWithID = (projectId) => {
        console.log('Navigating to project:', projectId);
        navigate(`/project/${projectId}`);
    };

    if (!projects || projects.length === 0) {
        return <div>No projects available</div>;
    }

    return (
        <div>
            {projects.map(project => {
                const projectId = project.id || project.project_id;
                return (
                    <div key={projectId} className="bgcolor" onClick={() => { HandleCardWithID(projectId) }}>
                        <span className="spanheading">Project Name:</span> 
                        <span className="spanvalue"> {project.name || project.project_name}</span>
                        <span style={{ float: 'right' }}>
                            <div className="btn-group dropup">
                                <button type="button" className="btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" style={{ backgroundColor: 'rgb(170, 143, 94)' }}>
                                </button>
                                <ul className="dropdown-menu">
                                    <li className="btn">Assign Members</li>
                                    <li className="btn">View Logs</li>
                                    <li className="btn">Create a Task</li>
                                </ul>
                            </div>
                        </span>
                        <div className="singlecardContainer">
                            <div className="card mb-3 cardclass">
                                <div className="row g-0 eachCard projectDetails">
                                    <div className="leftside">
                                        <h3 className="spanvalueCARD">PROJECT DETAILS</h3>
                                        <div className="leftSideAssign">
                                            <div> 
                                                <span className="leftSideAssignKEY">Name: </span> 
                                                <span className="leftSideAssignVALUE">{project.name || project.project_name}</span>
                                            </div>
                                            <div>
                                                <span className="leftSideAssignKEY">Description: </span> 
                                                <span className="leftSideAssignVALUE">
                                                    {project.description || project.project_details || 'No description available'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="leftSideAssignKEY">Status: </span> 
                                                <span className="leftSideAssignVALUE">{project.status || 'Unknown'}</span>
                                            </div>
                                            <div>
                                                <span className="leftSideAssignKEY">Priority: </span> 
                                                <span className="leftSideAssignVALUE">{project.priority || 'Medium'}</span>
                                            </div>
                                            <div>
                                                <span className="leftSideAssignKEY">Started Date: </span> 
                                                <span className="leftSideAssignVALUE">
                                                    {project.createdAt ? project.createdAt.split('T')[0] : 'Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card mb-3 cardclass">
                                <div className="row g-0 eachCard">
                                    <div className="leftside">
                                        <h3 className="spanvalueCARD">
                                            ASSIGNED TO ({project.assignments?.length || 0})
                                        </h3>
                                        <div className="leftSideAssign">
                                            {project.assignments && project.assignments.length > 0 ? (
                                                project.assignments.map((assignment, index) => (
                                                    <div key={index}>
                                                        <div className="NameConatiner">
                                                            <div>
                                                                <div>
                                                                    <span className="leftSideAssignKEY">Name: </span> 
                                                                    <span className="leftSideAssignVALUE">
                                                                        {assignment.user?.name || 'Unknown'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="leftSideAssignKEY">Role:</span> 
                                                                    <span className="leftSideAssignVALUE">
                                                                        {assignment.user?.role || 'Unknown'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="LINE"></div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div>No members assigned</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card mb-3 cardclass">
                                <div className="row g-0 eachCard">
                                    <div className="leftside">
                                        <h3 className="spanvalueCARD">
                                            TASKS ({project.tasks?.length || 0})
                                        </h3>
                                        <div className="leftSideAssign">
                                            {project.tasks && project.tasks.length > 0 ? (
                                                project.tasks.map((task, index) => (
                                                    <div key={index}>
                                                        <div className="NameConatiner">
                                                            <div>
                                                                <div>
                                                                    <span className="leftSideAssignKEY">Name: </span> 
                                                                    <span className="leftSideAssignVALUE">
                                                                        {task.title || task.task_name || 'Unknown'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="leftSideAssignKEY">Status:</span> 
                                                                    <span className="leftSideAssignVALUE">
                                                                        {task.status || 'Unknown'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="leftSideAssignKEY">Priority:</span> 
                                                                    <span className="leftSideAssignVALUE">
                                                                        {task.priority || 'Medium'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="leftSideAssignKEY">Created Date:</span> 
                                                                    <span className="leftSideAssignVALUE">
                                                                        {task.createdAt ? task.createdAt.split('T')[0] : 'Unknown'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="LINE"></div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div>No tasks available</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default HandleCardData;