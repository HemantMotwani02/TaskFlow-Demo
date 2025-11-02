import { useNavigate, useParams } from "react-router-dom";

import AssignMembers from "../AssignMembers";

const AssignProjectMember = () => {
  const navigate = useNavigate();
  const { project_id } = useParams();

  return (
    <>
      <p className="link" onClick={() => navigate(-1)}>Back</p>
      <div className="MainDiv-for-single-functionality p-3 " style={{ border: '2px solid red' }}>
        
        {
          project_id ? <>

            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}><h2 className="">Assign Members</h2></div>

            <AssignMembers project_id={project_id} />
          </> : <div>Loading or no data found.</div>
        }
      </div>
    </>
  )
}

export default AssignProjectMember;