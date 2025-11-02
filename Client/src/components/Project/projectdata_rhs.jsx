import axios from "axios";
import { useEffect, useReducer, useState } from "react";

function ProjectData_rhs({ project_id }) {
  const [projectData, setProjectData] = useState()
  const [ignored, forceUpdate] = useReducer(x => x + 1, 0)

  function parentFunction() {
    console.log('hey in parent')
    forceUpdate()
  }

  useEffect(() => {
    const getProjectByPid = async () => {
      let response = await axios.get(`http://localhost:7007/project-details-project/${project_id}`)
      setProjectData(await response.data.result[0])
      console.log(projectData)
    }
    getProjectByPid()
  }, []);

  return (<>
    {
      projectData ? <div className="projectDetails2">
        <h2 className="project_h" style={{ textAlign: 'center' }}>Project Details</h2>
        <ul className="list-group pul" >
          <li className="list-group-item active" style={{ backgroundColor: '#212529' }}><b>{projectData.project_name}</b></li>
          <li className="list-group-item pul1"><b>Project Description : </b>{projectData.project_details}</li>
          <li className="list-group-item"><b>Assigned By : </b>Admin</li>
          <li className="list-group-item"><b>Assigned To : </b>{projectData.userinfo.name}</li>
          <li className="list-group-item"><b>Starting Date : </b>{projectData.created_at.split('T')[0]}</li>
        </ul>
      </div> : <div>Loading....</div>
    }

  </>

  )
}
export default ProjectData_rhs;