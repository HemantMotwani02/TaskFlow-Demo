import ProjectData_rhs from "./Project/projectdata_rhs";
import Projectmembers_rhs from "./Projectmembers_rhs";
import Projecttasks_rhs from "./Tasks/ProjectTasks_rhs";

function RightProjectDetails({ project_id }) {
     return (
          <div className="RightSideContainer ">
               <div className="projectDiv1">
                    <ProjectData_rhs project_id={project_id} />
                    <Projecttasks_rhs project_id={project_id} />

               </div>
               <div className="membersAssigned">
                    <Projectmembers_rhs project_id={project_id} />
               </div>
          </div>
     )
}

export default RightProjectDetails;