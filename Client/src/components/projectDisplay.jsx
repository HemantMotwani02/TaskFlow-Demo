import { useReducer } from 'react';
import roleUtils from '../utils/roleUtils';
import { ROLES } from '../store';
import { useNavigate, useParams } from "react-router-dom";
import ProjectDetailComponent from "./LogTable/projectdetailComponent";
import ProjectData_rhs from "./Project/projectdata_rhs";
import Projectmembers_rhs from "./Projectmembers_rhs";


const ProjectDisplay = () => {
  const auth = roleUtils.getUserFromLocalStorage();
  const name = auth?.result?.name;
  const role = auth?.result?.role;

  const navigate = useNavigate()
  const { project_id } = useParams();
  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

  function parentFunction() {
    console.log('hey in parent');
    forceUpdate();
  }

  
  const handleBtnClick = (project_id) => {
    navigate(`/create-task/${project_id}`)
  }

  const handleTaskClick = (project_id) => {
    navigate(`/project/${project_id}/tasks`)
  }
  const handleBtnClickMembers = (project_id) => {
    navigate(`/project/${project_id}/assign-members`)
  }


  return (
    <>
      <p className="link" onClick={() => navigate(-1)}>Back</p>
      <div className="MainDiv p-3" draggable={true}>
        {
          project_id ? <>

            <div style={{ display: "flex", justifyContent: "center", width: "100%", borderBottom: "1px solid black" }}><h3 className="">Showing Result for the Project</h3></div>
            <div className="left-container">
              <div className="logAndproject">
                <div className="LogContainer ">
                  <ProjectDetailComponent project_id={project_id} />

                </div>
                <div className="fc-pdata-pmembers">
                  <ProjectData_rhs project_id={project_id} />
                  <Projectmembers_rhs project_id={project_id} />
                </div>

              </div>

              <div className="btn-class-display">

                <button onClick={() => { handleBtnClick(project_id) }} className="btn btn-md btn-primary">Create a Task</button>
                {role === ROLES.DEVELOPER ? (<></>) : <><button onClick={() => { handleBtnClickMembers(project_id) }} className="btn btn-md btn-warning">Assign Members</button></>}
                {/*{task.length?}*/}      <button onClick={() => { handleTaskClick(project_id) }} className="btn btn-md btn-dark">View Tasks</button>

              </div>
            </div>

            {/* <RightProjectDetails pid={pid} /> */}
          </> : <div>loading...</div>
        }
      </div>
    </>
  )
}

export default ProjectDisplay;